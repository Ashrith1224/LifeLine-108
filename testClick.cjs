const { chromium } = require("playwright");
(async () => {
    try {
        const browser = await chromium.launch();
        const context = await browser.newContext();
        const page = await context.newPage();
        await page.goto("http://localhost:5173/");
        console.log("Title:", await page.title());
        await page.waitForTimeout(3000); // let UI load
        const HTML = await page.content();

        let foundViewAll = HTML.includes("View All");
        let foundAcceptRequest = HTML.includes("Accept Request");
        let foundCheckDashboard = HTML.includes("Check Dashboard");

        console.log("Has 'View All':", foundViewAll);
        console.log("Has 'Accept Request':", foundAcceptRequest);
        console.log("Has 'Check Dashboard':", foundCheckDashboard);

        await browser.close();
    } catch (err) {
        console.error("Playwright test failed:", err.message);
    }
})();
