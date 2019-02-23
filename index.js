
const puppeteer = require('puppeteer');

async function run() {
	const browser = await puppeteer.launch({ headless: false });
	const page = await browser.newPage();
	const fs = require('fs');
	fs.writeFile("./users.txt", ``, function (err) {
		if (err) {
			return console.log(err);
		}
		console.log("The file was reset!");
	});

	const SEARCH_STRING = '<TEXT TO SEARCH>';
	// Repositories, Code, Commits, Issues, Users, Wikis
	const TYPE_OF_SEARCH = 'Users';

	const USERNAME_SELECTOR = '#login_field';
	const PASSWORD_SELECTOR = '#password';
	const BUTTON_SELECTOR = '#login > form > div.auth-form-body.mt-3 > input.btn.btn-primary.btn-block';

	const LIST_USERNAME_SELECTOR = '#user_search_results > div.user-list > div:nth-child(INDEX) > div.d-flex.flex-auto > div > a';
	const LIST_EMAIL_SELECTOR = '#user_search_results > div.user-list > div:nth-child(INDEX) > div.d-flex.flex-auto > div > ul > li:nth-child(2) > a';

	const LENGTH_SELECTOR_CLASS = 'user-list-item';

	const CREDS = require('./creds');

	// Take screenshot of landing page
	// await page.goto('https://github.com');
	// await page.screenshot({ path: 'screenshots/github.png' });

	// Navigate to login page
	await page.goto('https://github.com/login');

	await page.click(USERNAME_SELECTOR);
	await page.keyboard.type(CREDS.username);

	await page.click(PASSWORD_SELECTOR);
	await page.keyboard.type(CREDS.password);

	await page.click(BUTTON_SELECTOR);

	await page.waitForNavigation();


	const SEARCH_URL = `https://github.com/search?q=${SEARCH_STRING}&type=Users`;

	await page.goto(SEARCH_URL);
	await page.waitFor(2 * 1000);

	let numOfPages = await getNumOfPages(page);

	for (let p = 1; p <= numOfPages; p++) {

		let pageUrl = SEARCH_URL + '&p=' + p;

		await page.goto(pageUrl);

		// Number of results in page
		let listLength = await page.evaluate((sel) => {
			return document.getElementsByClassName(sel).length
		}, LENGTH_SELECTOR_CLASS);

		for (let i = 1; i <= listLength; i++) {
			let userNameSelector = LIST_USERNAME_SELECTOR.replace('INDEX', i);
			let emailSelector = LIST_EMAIL_SELECTOR.replace('INDEX', i);

			let username = await page.evaluate((sel) => {
				return document.querySelector(sel).getAttribute('href').replace('/', '');
			}, userNameSelector);

			let email = await page.evaluate((sel) => {
				let element = document.querySelector(sel);
				return element ? element.innerHTML : null;
			}, emailSelector);

			// console.log(username + ' -> ', email);

			
			fs.appendFile("./users.txt", `Username -> ${username}  Email -> ${email} \n`, function (err) {
				if (err) {
					return console.log(err);
				}				
			});

		}
	}
	// browser.close();
}

async function getNumOfPages(page) {
	const NUM_USER_SELECTOR = '#js-pjax-container > div > div.col-12.col-md-9.float-left.px-2.pt-3.pt-md-0.codesearch-results > div > div.d-flex.flex-column.flex-md-row.flex-justify-between.border-bottom.pb-3.position-relative > h3';

	let inner = await page.evaluate((sel) => {
		let html = document.querySelector(sel).innerHTML;
		return html.replace(',', '').replace('users', '').trim();
	}, NUM_USER_SELECTOR);

	let numUsers = parseInt(inner);

	console.log('Num of users -> ', numUsers);

	let numPages = Math.ceil(numUsers / 10);
	return numPages;
}
run();