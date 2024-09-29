import boto3
import os
from dotenv import load_dotenv

load_dotenv()

# Configuration AWS
AWS_ACCESS_KEY = os.getenv('aws_access_key')
AWS_SECRET_KEY = os.getenv('aws_secret_key')
AWS_REGION = os.getenv('aws_region_name')
S3_BUCKET_NAME = os.getenv('bucket_name')

# Nom du fichier CSV local
CSV_FILE_NAME = 'eco2mix-national-tr.csv'

# Nom du fichier dans S3 (vous pouvez le changer si vous voulez)
S3_FILE_NAME = 'eco2mix-national-tr.csv'

def upload_to_s3(file_name, bucket, object_name=None):
    """
    Charge un fichier dans un bucket S3
    :param file_name: Fichier à charger
    :param bucket: Bucket à utiliser
    :param object_name: Nom de l'objet S3. Si non spécifié, file_name est utilisé
    :return: True si le fichier a été chargé, False sinon
    """
    # Si S3 object_name n'a pas été spécifié, on utilise file_name
    if object_name is None:
        object_name = file_name

    # Créer un client S3
    s3_client = boto3.client('s3',
                             aws_access_key_id=AWS_ACCESS_KEY,
                             aws_secret_access_key=AWS_SECRET_KEY,
                             region_name=AWS_REGION)
    try:
        s3_client.upload_file(file_name, bucket, object_name)
    except Exception as e:
        print(f"Une erreur s'est produite : {e}")
        return False
    return True

def main():
    print(f"Début du chargement de {CSV_FILE_NAME} vers S3...")
    success = upload_to_s3(CSV_FILE_NAME, S3_BUCKET_NAME, S3_FILE_NAME)
    if success:
        print(f"Le fichier {CSV_FILE_NAME} a été chargé avec succès dans le bucket {S3_BUCKET_NAME} sous le nom {S3_FILE_NAME}")
    else:
        print("Le chargement a échoué.")

if __name__ == "__main__":
    main()