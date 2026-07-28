output "bucket_name" {
  description = "Terraform remote state bucket name"
  value       = aws_s3_bucket.terraform_state.bucket
}

output "dynamodb_table_name" {
  description = "Terraform state lock table name"
  value       = aws_dynamodb_table.terraform_lock.name
}