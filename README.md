# Welcome to your CDK JavaScript project

## Useful commands

* `npm run test`         perform the jest unit tests
* `npx cdk deploy`       deploy this stack to your default AWS account/region
* `npx cdk diff`         compare deployed stack with current state
* `npx cdk synth`        emits the synthesized CloudFormation template

![Alt text](https://assets.community.aws/a/2c2iuZfLXZRMnEJm9kpj7kHwwDs/Unti.webp "architecture")

# Prerequisites

* AWS Cli

* NPM 

```console
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.8/install.sh | bash
nvm install node npm
npm i
```

* CDK 

* Docker 

* Access to `amazon.titan-embed-text-v1` model on Bedrock

# Getting started

1. `aws build`

2. `aws s3 sync data s3://resumeaistack-b7-kdx14wcvfzst^Cedrockragbucketdfd7a7c7-kdx14wcvfzst`

# Clean 

1. `aws destroy`

# References

* [Easy Serverless RAG with Knowledge Base for Amazon Bedrock](https://community.aws/content/2bi5tqITxIperTzMsD3ohYbPIA4/easy-rag-with-amazon-bedrock-knowledge-base)

* []