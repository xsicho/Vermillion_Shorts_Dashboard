async function refreshAllViews() {
    const btn = document.getElementById('refreshAllBtn');
    const eligibleScripts = scripts.filter(s => s.ytUrl && s.ytUrl.trim().length > 0);

    if (eligibleScripts.length === 0) {
        alert('No clips with YouTube links found.');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = `<span>⏳</span> Syncing ${eligibleScripts.length} Shorts...`;

    let updatedCount = 0;

    for (const script of eligibleScripts) {
        try {
            const match = script.ytUrl.match(/(?:shorts\/|v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
            const videoId = match ? match[1] : null;

            if (!videoId) continue;

            // Direct fetch via CORS proxy or web page payload
            const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
            const html = await res.text();
            
            const viewMatch = html.match(/"viewCount":"(\d+)"/);
            if (viewMatch) {
                script.views = parseInt(viewMatch[1], 10);
                script.status = "uploaded";
                script.completed = true;
                updatedCount++;
            }
        } catch (err) {
            console.warn(`Browser fetch restricted for #${script.id}:`, err);
        }
    }

    renderScripts();
    await saveToKV();

    btn.disabled = false;
    btn.innerHTML = `<span>🔄</span> Refresh All Views`;
    alert(`Successfully updated ${updatedCount} YouTube Shorts!`);
}
