export function renderNav(model) {

    return `

    <nav>
        ${model.user ? loggedInNav(model) : loggedOutNav(model)}
    </nav>

    `;

}

function loggedInNav(model) {

    return `

        ${model.user.displayName} ${model.user.email}
        <button class="google-sign-out">Sign out</button>

    `;

}

function loggedOutNav(model) {

    return `

        <button class="google-sign-in">Sign in</button>

    `;

}
