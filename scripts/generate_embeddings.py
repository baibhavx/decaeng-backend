import openai
import psycopg2
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# OpenAI API Key
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Database connection settings
DB_NAME = "incident_db"
DB_USER = "postgres"
DB_PASSWORD = os.getenv("POSTGRES_PASSWORD")  # Store this in .env
DB_HOST = "localhost"  # Change if running on a different machine
DB_PORT = "5432"

# Function to generate embeddings using OpenAI
def generate_embedding(text):
    response = openai.embeddings.create(
        input=text,
        model="text-embedding-ada-002"
    )
    return response.data[0].embedding  # Extract vector from API response

# Connect to PostgreSQL
conn = psycopg2.connect(
    dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD, host=DB_HOST, port=DB_PORT
)
cursor = conn.cursor()

# Fetch incidents that don’t have embeddings yet
cursor.execute("SELECT id, title, description FROM incidents WHERE embedding IS NULL;")
incidents = cursor.fetchall()

if not incidents:
    print("✅ All incidents already have embeddings. No updates needed.")
else:
    for incident in incidents:
        incident_id, title, description = incident
        full_text = f"{title}. {description}"  # Combine title + description
        embedding = generate_embedding(full_text)

        # Update the database with the generated embedding
        cursor.execute(
            "UPDATE incidents SET embedding = %s WHERE id = %s;",
            (embedding, incident_id)
        )
        conn.commit()

    print(f"✅ Successfully generated embeddings for {len(incidents)} incidents.")

# Close database connection
cursor.close()
conn.close()

