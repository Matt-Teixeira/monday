const parse_cookie = (resHeaderData) => {

    const cookies = resHeaderData['set-cookie'].join(" ");

    const aspxReg = /.ASPXAUTH=\w+/
    const aspnetReg = /ASP.NET_SessionId=\w+/
    const reqIdReg = /requestid=\w+/
    const reqStateReg = /requeststat=\+st:\w+\+sc:~(\/\w+)+\+start:\w+\+tg:/

    const aspxAuth = cookies.match(aspxReg)[0];
    const aspNet = cookies.match(aspnetReg)[0];
    const time = "Locale=TimeZone=GMTM0500G&Culture=en-US";
    const branch = "UserBranch=";
    const reqId = cookies.match(reqIdReg)[0]
    const reqState = cookies.match(reqStateReg)[0]
    
    const newArray = [aspxAuth, aspNet, time, branch, reqId, reqState]
    const newStr = newArray.join("; ");

    console.log("\nnewStr");
    console.log(newStr);

    return newStr;
}

module.exports = parse_cookie;