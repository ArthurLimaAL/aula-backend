export let users = [
    {
        username: 'alexandre',
        scores: [3, 2]
    }
];


export const findUser = (username) => {
    return users.find(user => user.username.toLowerCase() === username.toLowerCase());
}

export const createUser = (username) => {
    const newUser = {
        username: username,
        scores: []
    };
    users.push(newUser);
    return newUser;
};