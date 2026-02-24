import os
from typing import List, Optional
from uuid import uuid4
from datetime import datetime
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from azure.data.tables import TableClient
from azure.core.exceptions import ResourceNotFoundError

app = FastAPI()

# --- Configuration ---
# Use "UseDevelopmentStorage=true" for local Azurite emulator
CONNECTION_STRING = os.getenv("AzureWebJobsStorage", "UseDevelopmentStorage=true")
GROUPS_TABLE_NAME = "groups"
EXPENSES_TABLE_NAME = "expenses"

# --- Models ---

class Member(BaseModel):
    id: str
    name: string

class ExpenseBase(BaseModel):
    description: str
    amount: float
    paidBy: str
    splitBetween: List[str]

class Expense(ExpenseBase):
    id: str
    createdAt: str
    groupId: str

class GroupCreate(BaseModel):
    name: str
    members: List[Member]

class Group(GroupCreate):
    id: str


# --- Helpers ---

def get_table_client(table_name: str) -> TableClient:
    try:
        client = TableClient.from_connection_string(conn_str=CONNECTION_STRING, table_name=table_name)
        try:
           client.create_table()
        except Exception:
           pass # Table already exists
        return client
    except ValueError:
        # Fallback for when emulated storage isn't reachable or variable is missing
        print("Warning: Could not connect to table storage.")
        raise HTTPException(status_code=500, detail="Database connection failed")

# --- Routes ---

@app.get("/")
async def root():
    return {"message": "Splitesh Backend Running"}

@app.post("/groups", response_model=Group)
async def create_group(group_data: GroupCreate):
    group_id = str(uuid4())
    group = Group(id=group_id, **group_data.dict())
    
    # Store group metadata (PartitionKey='Group', RowKey=group_id)
    # We serialize members as a JSON string or simplified list for Table Storage
    # For simplicity, we'll store basic fields. Complex objects in Table Storage usually need serialization.
    import json
    
    entity = {
        "PartitionKey": "Group",
        "RowKey": group_id,
        "Name": group.name,
        "Members": json.dumps([m.dict() for m in group.members])
    }
    
    with get_table_client(GROUPS_TABLE_NAME) as client:
        client.create_entity(entity=entity)
        
    return group

@app.get("/groups/{group_id}", response_model=Group)
async def get_group(group_id: str):
    import json
    try:
        with get_table_client(GROUPS_TABLE_NAME) as client:
            entity = client.get_entity(partition_key="Group", row_key=group_id)
            
        members_data = json.loads(entity.get("Members", "[]"))
        members = [Member(**m) for m in members_data]
        
        return Group(
            id=entity["RowKey"],
            name=entity["Name"],
            members=members
        )
    except ResourceNotFoundError:
        raise HTTPException(status_code=404, detail="Group not found")

@app.post("/groups/{group_id}/expenses", response_model=Expense)
async def add_expense(group_id: str, expense_data: ExpenseBase):
    expense_id = str(uuid4())
    created_at = datetime.utcnow().isoformat()
    
    expense = Expense(
        id=expense_id,
        groupId=group_id,
        createdAt=created_at,
        **expense_data.dict()
    )
    
    import json
    entity = {
        "PartitionKey": group_id, # Partition by Group ID for efficient querying of group expenses
        "RowKey": expense_id,
        "Description": expense.description,
        "Amount": expense.amount,
        "PaidBy": expense.paidBy,
        "SplitBetween": json.dumps(expense.splitBetween),
        "CreatedAt": created_at
    }
    
    with get_table_client(EXPENSES_TABLE_NAME) as client:
        client.create_entity(entity=entity)
        
    return expense

@app.get("/groups/{group_id}/expenses", response_model=List[Expense])
async def get_group_expenses(group_id: str):
    import json
    expenses = []
    
    with get_table_client(EXPENSES_TABLE_NAME) as client:
        # Query all expenses for this group
        query_filter = f"PartitionKey eq '{group_id}'"
        entities = client.query_entities(query_filter)
        
        for entity in entities:
             expenses.append(Expense(
                 id=entity["RowKey"],
                 groupId=group_id,
                 createdAt=entity.get("CreatedAt", ""),
                 description=entity.get("Description", ""),
                 amount=float(entity.get("Amount", 0)),
                 paidBy=entity.get("PaidBy", ""),
                 splitBetween=json.loads(entity.get("SplitBetween", "[]"))
             ))
             
    return expenses

@app.get("/groups", response_model=List[Group])
async def list_groups():
    import json
    groups = []
    with get_table_client(GROUPS_TABLE_NAME) as client:
        # Query all groups
        try:
            # Note: For large datasets, this should be paginated. 
            # query_entities returns an iterator that handles pagination automatically for iteration
            entities = client.query_entities("PartitionKey eq 'Group'")
            for entity in entities:
                members_data = json.loads(entity.get("Members", "[]"))
                members = [Member(**m) for m in members_data]
                groups.append(Group(
                    id=entity["RowKey"],
                    name=entity["Name"],
                    members=members
                ))
        except Exception as e:
            # Table might not exist yet if no groups created
            pass
    return groups

@app.post("/groups/{group_id}/members", response_model=Group)
async def add_member(group_id: str, member: Member):
    import json
    with get_table_client(GROUPS_TABLE_NAME) as client:
        try:
            entity = client.get_entity(partition_key="Group", row_key=group_id)
            members_data = json.loads(entity.get("Members", "[]"))
            
            # Check for duplicates based on name? The frontend does it, but good to have here.
            # For now, let's just append.
            members_data.append(member.dict())
            
            # Update entity
            entity["Members"] = json.dumps(members_data)
            client.update_entity(mode="merge", entity=entity)
            
            members = [Member(**m) for m in members_data]
            return Group(
                id=entity["RowKey"],
                name=entity["Name"],
                members=members
            )
        except ResourceNotFoundError:
            raise HTTPException(status_code=404, detail="Group not found")

@app.delete("/groups/{group_id}")
async def delete_group(group_id: str):
    # Delete the group entity
    with get_table_client(GROUPS_TABLE_NAME) as client:
        try:
            client.delete_entity(partition_key="Group", row_key=group_id)
        except ResourceNotFoundError:
            raise HTTPException(status_code=404, detail="Group not found")

    # Also delete all expenses belonging to this group
    with get_table_client(EXPENSES_TABLE_NAME) as client:
        query_filter = f"PartitionKey eq '{group_id}'"
        entities = client.query_entities(query_filter)
        for entity in entities:
            client.delete_entity(partition_key=group_id, row_key=entity["RowKey"])

    return {"detail": "Group deleted"}

@app.delete("/groups/{group_id}/members/{member_id}", response_model=Group)
async def remove_member(group_id: str, member_id: str):
    import json

    # Remove expenses where this member is paidBy or in splitBetween
    with get_table_client(EXPENSES_TABLE_NAME) as client:
        query_filter = f"PartitionKey eq '{group_id}'"
        entities = client.query_entities(query_filter)
        for entity in entities:
            split_between = json.loads(entity.get("SplitBetween", "[]"))
            if entity.get("PaidBy") == member_id or member_id in split_between:
                client.delete_entity(partition_key=group_id, row_key=entity["RowKey"])

    # Remove member from group
    with get_table_client(GROUPS_TABLE_NAME) as client:
        try:
            entity = client.get_entity(partition_key="Group", row_key=group_id)
            members_data = json.loads(entity.get("Members", "[]"))

            members_data = [m for m in members_data if m.get("id") != member_id]

            entity["Members"] = json.dumps(members_data)
            client.update_entity(mode="merge", entity=entity)

            members = [Member(**m) for m in members_data]
            return Group(
                id=entity["RowKey"],
                name=entity["Name"],
                members=members
            )
        except ResourceNotFoundError:
            raise HTTPException(status_code=404, detail="Group not found")

@app.delete("/groups/{group_id}/expenses/{expense_id}")
async def delete_expense(group_id: str, expense_id: str):
    with get_table_client(EXPENSES_TABLE_NAME) as client:
        try:
            client.delete_entity(partition_key=group_id, row_key=expense_id)
        except ResourceNotFoundError:
            raise HTTPException(status_code=404, detail="Expense not found")
    return {"detail": "Expense deleted"}