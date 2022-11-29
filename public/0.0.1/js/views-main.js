export function renderNav(model) {

    return `

    <nav>
        ${model.user ? loggedInNav(model) : loggedOutNav(model)}
    </nav>

    `;

}

function loggedInNav(model) {

    return `

        ${model.user.displayName}
        <button class="google-sign-out">Sign out</button>

    `;

}

function loggedOutNav(model) {

    return `

        <button class="google-sign-in">Sign in</button>

    `;

}

export function renderMain(model) {

    return "main";

}
