const N = 40;

const authCheck = async (ctx: any, token: string) => {
    const tokenExists =
      (await ctx.db
        .query("sessions")
       .filter((q: any) => q.eq(q.field("token"), token))
        .first()) != null;
    console.log(tokenExists)
    return tokenExists;
};

export default authCheck;