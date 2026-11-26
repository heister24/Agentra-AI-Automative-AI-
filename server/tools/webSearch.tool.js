import "dotenv/config";
import { tool } from "@langchain/core/tools";
import axios from "axios";
import { z } from "zod";

export const webSearchTool = tool(
  async ({ query = "Who are you" }) => {
    try {
      const apiKey = process.env.TAVILY_API_KEY;
      if (!apiKey) {
        return "Search failed: TAVILY_API_KEY is missing in server environment variables.";
      }

      console.log(`Web Search Tool Searching For : ${query}`);

      //Api Call
      const response = await axios.post(
        `https://api.tavily.com/search`,
        {
          api_key: apiKey,
          query: query,
          search_depth: "basic",
          max_results: 4,
          include_answer: true,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 15000,
        },
      );

      const data = response.data;
      //   console.log(data);

      const formattedOutput = [];

      if (data.answer) {
        formattedOutput.push(`Direct Answer : ${data.answer}`);
      }

      if (Array.isArray(data.results) && data.results.length > 0) {
        const resultItems = data.results.map((item, index) => {
          return `[${index + 1}] ${item.title} URL: ${item.url} Summary: ${item.content}`;
        });
        formattedOutput.push(`Search Results: \n${resultItems.join("\n\n")}`);
      }

      if (formattedOutput.length === 0) {
        return `No relevant web results found for query: "${query}".`;
      }

      return formattedOutput.join("\n\n--\n\n");
    } catch (error) {
      console.error("WebSearch Tool Error:", error.message);

      if (axios.isAxiosError(error)) {
        return `Failed to fetch search results for "${query}". ${
          error.response
            ? `Status: ${error.response.status}, Message: ${JSON.stringify(error.response.data)}`
            : error.message
        }`;
      }

      return `Failed to fetch search results for "${query}". Error details: ${error.message}`;
    }
  },
  {
    name: "web_search",
    description:
      "Search the live web for real-time information, recent news, live data, documentation, and factual queries.",
    schema: z.object({
      query: z
        .string()
        .trim()
        .describe("The precise search query to look up on Google/internet."),
    }),
  },
);
