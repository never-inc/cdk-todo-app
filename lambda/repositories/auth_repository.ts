import { CognitoJwtVerifier } from 'aws-jwt-verify'

export const verifyAccessToken = async (accessToken: string) => {
  const verifier = CognitoJwtVerifier.create({
    userPoolId: process.env.COGNITO_USER_POOL_ID ?? '',
    tokenUse: 'access',
    clientId: process.env.COGNITO_USER_POOL_CLIENT_ID ?? '',
  })
  const payload = await verifier.verify(accessToken)
  const userId = payload.sub
  console.log('userId', payload.sub)
  return userId
}
