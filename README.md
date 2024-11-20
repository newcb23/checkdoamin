# Domain Availability Checker

A web application that allows you to check the availability of multiple domain names at once. The application automatically cleans domain names by removing common prefixes (like www.) and suffixes.

## Features

- Batch domain name checking
- Automatic domain name cleaning
- Real-time availability status
- Beautiful and responsive UI
- Error handling and notifications

## Prerequisites

- Node.js 14.x or higher
- npm or yarn
- WHOIS XML API key (get it from [WhoisXMLAPI](https://whoisxmlapi.com/))

## Setup

1. Clone the repository:
\`\`\`bash
git clone https://github.com/yourusername/domain-checker.git
cd domain-checker
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
# or
yarn install
\`\`\`

3. Create a \`.env.local\` file in the root directory and add your WHOIS API key:
\`\`\`
WHOIS_API_KEY=your_api_key_here
\`\`\`

4. Run the development server:
\`\`\`bash
npm run dev
# or
yarn dev
\`\`\`

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deployment

The easiest way to deploy this application is using Vercel:

1. Push your code to GitHub
2. Import your repository to Vercel
3. Add your WHOIS API key to the environment variables in Vercel
4. Deploy!

## Built With

- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [WhoisXMLAPI](https://whoisxmlapi.com/) - Domain availability checking
- [React Hot Toast](https://react-hot-toast.com/) - Toast notifications

## License

This project is licensed under the MIT License.
