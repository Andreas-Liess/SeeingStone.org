export default async function handler(req, res) {
    const { name, email, company, message, analytics } = req.body;

    // 1. Google Form Config (Extracted from your link)
    const FORM_ID = '1FAIpQLScQQhkDqiSSsq7R3jdKaroPv3yjtNrgHmHv7g_XhIZo81YDUQ';
    const GOOGLE_URL = `https://docs.google.com/forms/d/e/${FORM_ID}/formResponse`;

    try {
        // Format analytics data as JSON string for Google Forms
        const analyticsData = analytics ? JSON.stringify(analytics) : 'No analytics data';

        // 2. Send data to Google Forms
        await fetch(GOOGLE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                'entry.1816007361': email,      // Email
                'entry.1782966477': company,    // Company
                'entry.1997805328': message,    // Networking pain/message
                'entry.1483401731': analyticsData  // Analytics data field
            })
        });

        // 3. Log to Vercel (Backup)
        console.log(`✅ Saved to Google Sheet: ${name} / ${email}`);
        if (analytics) {
            console.log(`📊 Analytics: Intent=${analytics.intentLevel}, Time=${analytics.timeToSubmit}`);
        }

        res.status(200).json({ success: true });

    } catch (error) {
        console.error('Google Sheet Error:', error);
        res.status(500).json({ error: 'Failed to save' });
    }
}