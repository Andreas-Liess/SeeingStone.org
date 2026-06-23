// Wait for the component's HTML to be loaded
document.addEventListener("DOMContentLoaded", () => {
    const userQueryBox = document.getElementById("user-query-box");
    const logList = document.getElementById("log-list");
    const finalReportBox = document.getElementById("final-report-box");

    let isAutoScrollActive = true;

    const script = [
        {
            type: "user",
            label: "[User]",
            content: `What should I know before Monica’s renewal call?`
        },
        {
            type: "thinking",
            label: "[Agent Step]",
            content: `Resolve Monica across contacts, email aliases, calendar attendees, and attached documents. Then check three things: last commitments, open risks, and contract mismatches.`
        },
        {
            type: "toolCall",
            label: "[Tool Call]",
            content: `query_private_workspace(query="Monica", scope=["emails", "attachments", "calendar", "contacts"])`
        },
        {
            type: "toolResult",
            label: "[Tool Result]",
            content: `-> 14 matches
- 7 email threads
- 3 PDF attachments
- 2 calendar entries
- 1 contact record
- 1 old proposal`
        },
        {
            type: "thinking",
            label: "[Agent Step]",
            content: `The calendar says this is a renewal call. I need the last commercial thread, the current contract, the latest proposal, and anyone else joining the meeting.`
        },
        {
            type: "toolCall",
            label: "[Tool Call]",
            content: `query_emails(person="Monica", filters=["renewal", "pricing", "security", "follow-up"])`
        },
        {
            type: "toolResult",
            label: "[Tool Result - Email]",
            content: `Found 3 relevant threads:
1. "Renewal terms — Q2"
Monica asked for updated pricing before the next call.
2. "Security questionnaire / DPA"
You promised to send the revised DPA by Friday. No sent follow-up found.
3. "Pilot feedback"
Monica flagged two invoice errors but said the team still wanted to continue if finance approved the renewal.`
        },
        {
            type: "toolCall",
            label: "[Tool Call]",
            content: `query_pdfs(query="Monica renewal contract proposal DPA", scope="attachments")`
        },
        {
            type: "toolResult",
            label: "[Tool Result - PDFs]",
            content: `Found 3 relevant PDFs:
1. Proposal_Q2_Renewal.pdf
Includes a 12 percent renewal discount if signed before month-end.
2. Contract_Draft_v4.pdf
Does not include the 12 percent renewal discount.
3. DPA_Revised.pdf
Exists locally but was not found in the sent email thread.`
        },
        {
            type: "toolCall",
            label: "[Tool Call]",
            content: `query_calendar(query="Monica renewal", date_range="next_14_days")`
        },
        {
            type: "toolResult",
            label: "[Tool Result - Calendar]",
            content: `1 upcoming meeting:
"Renewal call — Monica + Daniel"
Tomorrow, 10:00
Attendees: Monica Weber, Daniel Kraus, you`
        },
        {
            type: "thinking",
            label: "[Agent Step]",
            content: `Daniel is new in the calendar invite. Check who Daniel is and why he matters.`
        },
        {
            type: "toolCall",
            label: "[Tool Call]",
            content: `resolve_people(names=["Monica Weber", "Daniel Kraus"])`
        },
        {
            type: "toolResult",
            label: "[Tool Result - People]",
            content: `Monica Weber: Main relationship owner. Positive on product, waiting on pricing and DPA.
Daniel Kraus: Finance approver. Appears in one earlier email thread about invoice errors.`
        },
        {
            type: "thinking",
            label: "[Agent Step]",
            content: `There are three useful findings: one missing follow-up, one contract mismatch, and one hidden stakeholder.`
        },
        {
            type: "final",
            label: "[Agent Response - Final Summary]",
            title: "Monica Weber Renewal Brief",
            intro: `This is not a casual check-in. It is likely a renewal decision call.`,
            body: `<p>Three things matter:</p><ol><li><strong>Missing follow-up</strong><p>You promised Monica the revised DPA by Friday. The file exists, but no sent email was found.</p></li><li><strong>Contract mismatch</strong><p>The proposal includes a 12 percent renewal discount if signed before month-end. The contract draft does not include that discount.</p></li><li><strong>Finance risk</strong><p>Daniel Kraus is joining the call. He was previously involved in the invoice-error thread, so expect finance questions.</p></li></ol><h3>Best angle:</h3><p>Start by acknowledging the open DPA item. Then fix the contract mismatch before Monica or Daniel has to point it out. Keep the tone proactive, not defensive.</p><h3>Suggested opening:</h3><p>“Before we start, I checked the renewal documents. Two things are worth cleaning up: I owe you the revised DPA, and the discount from the proposal is not reflected in the contract draft yet. I’d rather fix both now than let them slow down approval.”</p>`,
            draft: `<strong>Drafted follow-up:</strong><div class="email-draft"><p>Hi Monica,</p><p>ahead of tomorrow’s renewal call, I checked the proposal, contract draft, and DPA.</p><p>Two things I want to clean up before approval:</p><p>1. The revised DPA is ready, but I do not see it in the sent thread. I will resend it.</p><p>2. The proposal includes the 12 percent renewal discount, but the current contract draft does not reflect it yet.</p><p>I also saw Daniel is joining, so I’ll be prepared to address the earlier invoice questions directly.</p><p>Best,<br>Lea</p></div>`
        }
    ];

    logList.addEventListener("scroll", () => {
        const threshold = 20;
        const position = logList.scrollTop + logList.clientHeight;
        const height = logList.scrollHeight;
        isAutoScrollActive = height - position <= threshold;
    });

    const scrollToBottom = () => {
        logList.scrollTop = logList.scrollHeight;
    };

    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const typeText = async (element, text, speed = 20) => {
        element.classList.add("typing");
        const lines = text.split("\n");
        for (const line of lines) {
            for (const char of line) {
                element.innerHTML += char;
                if (isAutoScrollActive) scrollToBottom();
                await delay(speed);
            }
            element.innerHTML += "\n";
        }
        element.classList.remove("typing");
    };

    const addLogEntry = async (item) => {
        const li = document.createElement("li");
        li.className = `log-entry ${item.type}`;

        const label = document.createElement("strong");
        label.className = "log-label";
        label.textContent = item.label;
        li.appendChild(label);

        const content = document.createElement("pre");
        li.appendChild(content);

        logList.appendChild(li);
        li.style.opacity = 1;

        if (isAutoScrollActive) scrollToBottom();

        if (item.type === "thinking") {
            await typeText(content, item.content, 10);
        } else {
            content.innerHTML = item.content;
            if (isAutoScrollActive) scrollToBottom();
        }
    };

    const runDemo = async () => {
        userQueryBox.innerHTML = "";
        logList.innerHTML = "";
        finalReportBox.innerHTML = "";
        userQueryBox.style.opacity = 0;
        finalReportBox.style.opacity = 0;
        isAutoScrollActive = true;

        await delay(500);

        for (const item of script) {
            switch (item.type) {
                case "user": {
                    userQueryBox.style.opacity = 1;
                    const userLabel = document.createElement("strong");
                    userLabel.className = "log-label";
                    userLabel.textContent = item.label;

                    const userContent = document.createElement("p");
                    userQueryBox.appendChild(userLabel);
                    userQueryBox.appendChild(userContent);

                    await typeText(userContent, item.content, 50);
                    await delay(900);
                    break;
                }
                case "thinking":
                    await addLogEntry(item);
                    await delay(400);
                    break;
                case "toolCall":
                    await addLogEntry(item);
                    await delay(200);
                    break;
                case "toolResult":
                    await addLogEntry(item);
                    await delay(450);
                    break;
                case "final": {
                    finalReportBox.style.opacity = 1;
                    finalReportBox.innerHTML = `
                        <strong class="log-label">${item.label}</strong>
                        <div class="report-content">
                            <h3></h3>
                            <p class="report-intro"></p>
                            <div class="report-body"></div>
                            <div class="report-draft"></div>
                        </div>
                    `;

                    const reportContent = finalReportBox.querySelector(".report-content");
                    reportContent.style.display = "block";

                    const titleEl = finalReportBox.querySelector("h3");
                    const introEl = finalReportBox.querySelector(".report-intro");
                    const bodyEl = finalReportBox.querySelector(".report-body");
                    const draftEl = finalReportBox.querySelector(".report-draft");

                    await typeText(titleEl, item.title, 30);
                    await delay(500);
                    await typeText(introEl, item.intro, 30);
                    await delay(500);

                    bodyEl.innerHTML = item.body;
                    await delay(1000);
                    draftEl.innerHTML = item.draft;
                    break;
                }
            }
        }
    };

    runDemo();
});
