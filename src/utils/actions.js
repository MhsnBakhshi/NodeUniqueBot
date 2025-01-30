const rqeuiredChannels = ["@NodeUnique"]

const checkUserMembership = async function (ctx) {
  const userId = ctx.message.from.id;
  let isMember = true;

  for (const channel of rqeuiredChannels) {
    const member = await ctx.telegram.getChatMember(channel, userId);
    if (member.status == "left" || member.status == "kicked") {
      isMember = false;
      break;
    }
  }

  return isMember;
}
module.exports  ={
  checkUserMembership
}