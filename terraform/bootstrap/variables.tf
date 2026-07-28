variable "aws_region" {
  description = "AWS region where bootstrap resources will be created"
  type        = string
  default     = "ap-south-1"
}

variable "bucket_name" {
  description = "Terraform remote state S3 bucket name"
  type        = string
}

variable "dynamodb_table_name" {
  description = "Terraform state lock DynamoDB table name"
  type        = string
}