import { Octokit } from "octokit";
import * as dotenv from "dotenv";
dotenv.config();

// GitHub bağlantısını kur (GitHub Token ile)
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const ORG = "sentiric-labs";

/**
 * core-specifications reposundan anayasa dosyalarını okur
 */
export async function getSpec(specName: string): Promise<string> {
    try {
        const response = await octokit.rest.repos.getContent({
            owner: ORG,
            repo: "core-specifications",
            path: specName,
        });
        
        // GitHub dosyaları base64 şifreli gönderir, onu metne çeviriyoruz
        if (!Array.isArray(response.data) && response.data.type === "file" && response.data.content) {
            return Buffer.from(response.data.content, "base64").toString("utf-8");
        }
        return "";
    } catch (error) {
        console.error(`❌ Hata: ${specName} dosyası okunamadı.`, error);
        return "";
    }
}

/**
 * content-engine reposunda otomatik Issue açar
 */
export async function createIssue(repo: string, title: string, body: string, labels: string[]): Promise<string> {
    try {
        const response = await octokit.rest.issues.create({
            owner: ORG,
            repo: repo,
            title: title,
            body: body,
            labels: labels,
        });
        return response.data.html_url;
    } catch (error) {
        console.error("❌ Hata: Issue oluşturulamadı.", error);
        return "";
    }
}
