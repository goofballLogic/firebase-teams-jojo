export function printPageConsoleMessages(context) {

    const blackListMessages = ["Auth Emulator"];
    const listen = page => page.on(
        "console",
        message => {
            const text = message.text();
            if (!blackListMessages.some(x => text.includes(x)))
                console.log(message);
        }
    );
    context.on("page", listen);
    context.pages().forEach(page => listen(page));

}
