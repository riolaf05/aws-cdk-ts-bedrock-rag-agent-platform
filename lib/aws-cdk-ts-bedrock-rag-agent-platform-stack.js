const { Stack, Duration, CfnOutput, RemovalPolicy } = require("aws-cdk-lib");

const s3 = require("aws-cdk-lib/aws-s3");
const lambda = require("aws-cdk-lib/aws-lambda");

const { bedrock } = require("@cdklabs/generative-ai-cdk-constructs");
const { S3EventSource } = require("aws-cdk-lib/aws-lambda-event-sources");
const iam = require("aws-cdk-lib/aws-iam");

class ResumeAiStack extends Stack {
  /**
   *
   * @param {Construct} scope
   * @param {string} id
   * @param {StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    const bedrockRAGBucket = new s3.Bucket(this, "bedrockRAGBucket", {
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const resumeKnowledgeBase = new bedrock.KnowledgeBase(
      this,
      "resumeKnowledgeBase",
      {
        embeddingsModel: bedrock.BedrockFoundationModel.TITAN_EMBED_TEXT_V1,
      }
    );

    const ragDataSource = new bedrock.S3DataSource(
      this,
      "ragDataSource",
      {
        bucket: bedrockRAGBucket,
        knowledgeBase: resumeKnowledgeBase,
        dataSourceName: "resume",
        chunkingStrategy: bedrock.ChunkingStrategy.FIXED_SIZE,
        maxTokens: 500,
        overlapPercentage: 20,
      }
    );

    const s3PutEventSource = new S3EventSource(bedrockRAGBucket, {
      events: [s3.EventType.OBJECT_CREATED_PUT],
    });

    const lambdaIngestionJob = new lambda.Function(this, "IngestionJob", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("./src/IngestJob"),
      timeout: Duration.minutes(5),
      environment: {
        KNOWLEDGE_BASE_ID: resumeKnowledgeBase.knowledgeBaseId,
        DATA_SOURCE_ID: ragDataSource.dataSourceId,
      },
    });

    lambdaIngestionJob.addEventSource(s3PutEventSource);

    lambdaIngestionJob.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["bedrock:StartIngestionJob"],
        resources: [resumeKnowledgeBase.knowledgeBaseArn],
      })
    );

    const lambdaQuery = new lambda.Function(this, "Query", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("./src/queryKnowledgeBase"),
      timeout: Duration.minutes(5),
      environment: {
        KNOWLEDGE_BASE_ID: resumeKnowledgeBase.knowledgeBaseId,
      },
    });

    const fnUrl = lambdaQuery.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      invokeMode: lambda.InvokeMode.BUFFERED,
      cors: {
        allowedOrigins: ["*"],
        allowedMethods: [lambda.HttpMethod.POST],
      },
    });

    lambdaQuery.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          "bedrock:RetrieveAndGenerate",
          "bedrock:Retrieve",
          "bedrock:InvokeModel",
        ],
        resources: ["*"],
      })
    );

    new CfnOutput(this, "KnowledgeBaseId", {
      value: resumeKnowledgeBase.knowledgeBaseId,
    });

    new CfnOutput(this, "QueryFunctionUrl", {
      value: fnUrl.url,
    });

    new CfnOutput(this, "bedrockRAGBucketName", {
      value: bedrockRAGBucket.bucketName,
    });
  }
}

module.exports = { ResumeAiStack };
