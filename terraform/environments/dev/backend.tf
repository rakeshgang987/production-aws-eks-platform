terraform {
  backend "s3" {
    bucket         = "peeter-production-aws-eks-platform-tfstate"
    key            = "dev/terraform.tfstate"
    region         = "ap-south-1"
    dynamodb_table = "production-aws-eks-platform-lock"
    encrypt        = true
  }
}