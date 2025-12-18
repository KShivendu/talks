import random
import uuid
from typing import List
from qdrant_client import QdrantClient
from qdrant_client.models import (
    PointStruct,
    ShardKeyWithFallback,
)

def generate_random_vector(size: int = 768) -> List[float]:
    """Generate a random normalized vector."""
    return [random.random() for _ in range(size)]

client = QdrantClient(host="localhost", port=6334, prefer_grpc=True)

def push_tenant_data(
    client: QdrantClient,
    collection_name: str,
    tenant_id: str,
    num_points: int,
    vector_size: int = 768,
    batch_size: int = 1000,
):
    """Push data for a specific tenant."""
    print(f"\n📊 Pushing {num_points:,} points for tenant '{tenant_id}'...")

    for batch_start in range(0, num_points, batch_size):
        batch_end = min(batch_start + batch_size, num_points)
        points = [
            PointStruct(
                id=str(uuid.uuid4()), # Must be unique for each point, not even shared across tenants
                vector=generate_random_vector(vector_size),
                payload={"group_id": tenant_id, "point_index": i},
            )
            for i in range(batch_start, batch_end)
        ]
        client.upsert(
            collection_name=collection_name,
            points=points,
            shard_key_selector=ShardKeyWithFallback(target=tenant_id, fallback="default"),
        )
        done = batch_end
        if done == num_points:
            print(f"  ✓ Inserted final batch of {len(points)} points")
        else:
            print(f"  ✓ Inserted batch of {len(points)} points (total: {done:,}/{num_points:,})")

    print(f"✅ Completed pushing data for tenant '{tenant_id}'")

if __name__ == "__main__":
    tenant_sizes = {
        "user_1": 2_000,
        "user_2": 5_000,
        "user_3": 20_000,
    }

    for tenant_id, num_points in tenant_sizes.items():
        push_tenant_data(
            client=client,
            collection_name="demo",
            tenant_id=tenant_id,
            num_points=num_points,
        )
