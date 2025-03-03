const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs-extra");
const path = require("path");

const RESULTS_DIR = path.join(__dirname, "results");
fs.ensureDirSync(RESULTS_DIR);

async function scrapeCalendarEvents() {
    const baseUrl = "https://www.du.edu/calendar";
    const resultFile = path.join(RESULTS_DIR, "calendar_events.json");
    const months = [
        "2025-01-01", "2025-02-01", "2025-03-01", "2025-04-01",
        "2025-05-01", "2025-06-01", "2025-07-01", "2025-08-01",
        "2025-09-01", "2025-10-01", "2025-11-01", "2025-12-01"
    ];

    const allEvents = [];

    for (const startDate of months) {
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);
        const endDateStr = endDate.toISOString().split("T")[0];

        const url = `${baseUrl}?search=&start_date=${startDate}&end_date=${endDateStr}`;
        console.log(`🔄 Fetching events for ${startDate} - ${endDateStr}...`);

        try {
            const { data } = await axios.get(url, { headers: { "User-Agent": "Mozilla/5.0" } });
            const $ = cheerio.load(data);

            $(".events-listing__item").each((i, el) => {
                const title = $(el).find("h3").text().trim();
                const date = $(el).find("p").first().text().trim();
                const time = $(el).find("p:contains('am'), p:contains('pm')").text().trim() || null;
                const location = $(el).find("p:contains('Community Commons')").text().trim() || null;
                const link = $(el).find("a").attr("href");

                if (title && date) {
                    const event = { title, date };
                    if (time) event.time = time;
                    if (location) event.location = location;
                    if (link) event.link = `https://www.du.edu${link}`;

                    allEvents.push(event);
                }
            });

            console.log(`✅ Successfully fetched ${allEvents.length} events so far.`);

        } catch (error) {
            console.error(`❌ Error fetching events for ${startDate}:`, error.message);
        }
    }

    fs.writeJsonSync(resultFile, { events: allEvents }, { spaces: 2 });
    console.log(`✅ Successfully saved ${allEvents.length} events to ${resultFile}`);
}

scrapeCalendarEvents();
