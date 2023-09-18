import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { UserPool, UserPoolClient, UserPoolClientIdentityProvider, AccountRecovery } from 'aws-cdk-lib/aws-cognito'
import { Table, AttributeType, BillingMode } from 'aws-cdk-lib/aws-dynamodb'
import { Runtime } from 'aws-cdk-lib/aws-lambda'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import { LambdaRestApi } from 'aws-cdk-lib/aws-apigateway'
import { CfnApp, CfnBranch } from 'aws-cdk-lib/aws-amplify'
import { BuildSpec } from 'aws-cdk-lib/aws-codebuild'

export class CdkTodoAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    /**
     * Cognito
     */
    // Amazon Cognito のユーザーディレクトリ
    const userPool = new UserPool(this, 'todo-app-user-pool', {
      userPoolName: 'todo-app-user-pool',
      selfSignUpEnabled: true, // Eメールで確認コードを受信し、それを使ってユーザーが確認済みとなり使用出来るようになる
      standardAttributes: {
        email: {
          required: true, // サインアップ時にemailアドレスを必須にする
          mutable: true, // emailアドレスの変更が可能
        },
      },
      signInAliases: { email: true, username: false }, // email:true とするとユーザー名にemailが使える emailのみでサインアップ、サインインしたい場合は username: falseにする
      autoVerify: { email: true }, // autoVerifyを記述しない場合、emailアドレスの検証が必要
      accountRecovery: AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // DESTROYの場合はスタックを削除するとuserPoolも削除される。本番環境はRetainを推奨
    })

    // アプリクライアントの定義
    const userPoolClient = new UserPoolClient(this, 'todo-app-user-pool-client', {
      userPool,
      authFlows: { adminUserPassword: true, userPassword: true, userSrp: true }, // adminUserPasswordがfalse場合、ユーザー名とパスワードでトークンの取得ができない
      supportedIdentityProviders: [UserPoolClientIdentityProvider.COGNITO],
    })

    /**
     * DynamoDB
     */
    const todoTable = new Table(this, 'todo-app-todo', {
      tableName: 'Todo',
      partitionKey: {
        name: 'todoId',
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST, // オンデマンド請求（使用した分だけ支払う）
      pointInTimeRecovery: true, // PITRを有効化（自動バックアップ）
      removalPolicy: cdk.RemovalPolicy.DESTROY, // DESTROYの場合はスタックを削除するとDBも削除される。本番環境はRetainを推奨
    })
    // GSIを設定
    todoTable.addGlobalSecondaryIndex({
      indexName: 'userIdCreatedAtIndex',
      partitionKey: {
        name: 'userId',
        type: AttributeType.STRING,
      },
      sortKey: {
        name: 'createdAt',
        type: AttributeType.STRING,
      },
    })

    /**
     * Lambda
     */
    const lambdaFunction = new NodejsFunction(this, 'todo-app-lambda', {
      entry: 'lambda/index.ts', //lambda 関数のエントリーポイント
      handler: 'handler', // 実行する関数名
      runtime: Runtime.NODEJS_18_X,
      memorySize: 128,
      environment: {
        COGNITO_USER_POOL_ID: userPool.userPoolId,
        COGNITO_USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
      },
      timeout: cdk.Duration.seconds(30),
    })
    todoTable.grantReadWriteData(lambdaFunction) // DBの読み取り書き込み権限をLambdaに付与

    /**
     * API Gateway
     */
    const restApi = new LambdaRestApi(this, 'todo-app-rest-api', {
      handler: lambdaFunction,
      deployOptions: {
        tracingEnabled: true, // X-Ray トレースの有効化
        stageName: 'v1',
      },
    })

    /**
     * Amplify Hosting
     */
    // const gitHubToken = '' // Personal Token
    // const gitHubRepositoryUrl = '' // フロントエンドのリポジトリURL

    // const amplifyApp = new CfnApp(this, 'todo-app-frontend', {
    //   name: 'todo-app-frontend',
    //   oauthToken: gitHubToken,
    //   repository: gitHubRepositoryUrl,
    //   enableBranchAutoDeletion: true,
    //   buildSpec: BuildSpec.fromObjectToYaml({
    //     version: 1,
    //     frontend: {
    //       phases: {
    //         preBuild: {
    //           commands: ['npm ci'],
    //         },
    //         build: {
    //           commands: ['npm run build'],
    //         },
    //       },
    //       artifacts: {
    //         baseDirectory: '.next',
    //         files: ['**/*'],
    //       },
    //       cache: {
    //         paths: ['node_modules/**/*'],
    //       },
    //     },
    //   }).toBuildSpec(),
    //   platform: 'WEB_COMPUTE', // SSRをする場合に必要
    //   customRules: [
    //     {
    //       source: '/<*>',
    //       target: '/index.html',
    //       status: '404-200',
    //     },
    //   ],
    //   autoBranchCreationConfig: {
    //     enableAutoBranchCreation: true,
    //     enableAutoBuild: true,
    //   },
    // })

    // new CfnBranch(this, 'main-branch', {
    //   appId: amplifyApp.attrAppId,
    //   branchName: 'main',
    //   enableAutoBuild: true,
    //   enablePerformanceMode: false,
    //   enablePullRequestPreview: false,
    //   stage: 'PRODUCTION',
    //   framework: 'Next.js - SSR',
    //   environmentVariables: [
    //     // フロントエンドからCognitoを利用するために必要
    //     {
    //       name: 'NEXT_PUBLIC_COGNITO_USER_POOL_ID',
    //       value: userPool.userPoolId,
    //     },
    //     {
    //       name: 'NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID',
    //       value: userPoolClient.userPoolClientId,
    //     },
    //     // Lambdaが設定されたAPI GatewayへアクセスするためのURL
    //     {
    //       name: 'NEXT_PUBLIC_REST_API_BASE_URL',
    //       value: restApi.url,
    //     },
    //   ],
    // })
  }
}
