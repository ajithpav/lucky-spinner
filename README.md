# Car Giveaway Contest Spinner


A simple and unique giveaway web app that lets you:


- Upload subscriber data from CSV
- Spin through the full subscriber list visually
- Pick a winner from uploaded subscribers
- Show full winner details after the spin
- Unlock hidden winner setup by double-clicking the W in Giveaway Wheel title


## Quick Run


1. Open this folder in VS Code.
2. Right click `index.html` and open with Live Server (or any static server).
3. Upload your CSV and start spinning.


## CSV Format


Use this header format:


name,email,phone,city,tier,s.no


Example rows are included in `sample-subscribers.csv`.


## Project Structure


Minimum required files for deployment:


- `index.html`
- `styles.css`
- `app.js`


Optional but recommended:


- `README.md`
- `sample-subscribers.csv`


## Vercel Free Hosting Guide (Step by Step)


### Step 1: Push project to GitHub


If your project is not in GitHub yet, run these commands in project folder:


```bash
git init
git add .
git commit -m "initial giveaway app"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```


If you already have a repo, just run:


```bash
git add .
git commit -m "update giveaway app"
git push
```


### Step 2: Deploy using Vercel website (recommended)


1. Go to https://vercel.com and sign in with GitHub.
2. Click **Add New...** -> **Project**.
3. Import your repository.
4. Framework preset: select **Other**.
5. Build Command: leave empty.
6. Output Directory: leave empty.
7. Click **Deploy**.


After deployment, Vercel gives you a free URL like:


`https://your-project-name.vercel.app`


### Step 3: Update app later


When you change code and push to GitHub, Vercel automatically redeploys.


### Option B: Deploy using Vercel CLI


1. Install Node.js if not installed.
2. Install Vercel CLI and login:


```bash
npm i -g vercel
vercel login
```


3. Deploy from project folder:


```bash
vercel
```


4. For production deployment:


```bash
vercel --prod
```


During first `vercel` run, answer prompts:


- Set up and deploy: Yes
- Which scope: your account
- Link to existing project: No (first time)
- Project name: choose any
- Directory: .


## Notes


- This app is static HTML/CSS/JS, so Vercel free tier is enough.
- No backend is required.
- Private winner setup is hidden by default and opens only on double-clicking the W letter in the title.
- If CSV/local behavior seems different in browser, do a hard refresh once (`Ctrl+F5`).



