const Page = require("./helpers/page");

let page;

beforeEach(async () => {
    page = await Page.build();

    await page.goto('localhost:3000');
});

afterEach(async() => {
    page.close();
});


describe('When logged in', async() => {
    beforeEach(async() => {
        await page.login();
        await page.click('.btn-floating[href="/blogs/new"]');
    });

    test('Can see blog create form', async () => {
        const label = await page.$eval('form label:nth-child(1)', el => el.innerText);
        expect(label).toEqual('Blog Title');
    });
});