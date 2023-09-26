export const handler = async (event: any, context: any) => {
  console.log('sign_up_event', JSON.stringify(event))
  return event
}
