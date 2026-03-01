'use server';
/**
 * @fileOverview An AI agent that analyzes tabular data and provides a concise summary or identifies patterns.
 *
 * - dataInsightSummary - A function that handles the data insight summary process.
 * - DataInsightSummaryInput - The input type for the dataInsightSummary function.
 * - DataInsightSummaryOutput - The return type for the dataInsightSummary function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DataInsightSummaryInputSchema = z.object({
  data: z.array(z.record(z.any())).describe('The tabular data to be analyzed, as an array of objects where each object is a row.'),
});
export type DataInsightSummaryInput = z.infer<typeof DataInsightSummaryInputSchema>;

const DataInsightSummaryOutputSchema = z.object({
  summary: z.string().describe('A concise summary or identified patterns from the analyzed data.'),
});
export type DataInsightSummaryOutput = z.infer<typeof DataInsightSummaryOutputSchema>;

// Internal schema for the prompt to receive the stringified data
const PromptInputSchema = z.object({
    json_data_string: z.string().describe('The tabular data to be analyzed, as a JSON string.'),
});

export async function dataInsightSummary(input: DataInsightSummaryInput): Promise<DataInsightSummaryOutput> {
  return dataInsightSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'dataInsightSummaryPrompt',
  input: { schema: PromptInputSchema },
  output: { schema: DataInsightSummaryOutputSchema },
  prompt: `请分析以下表格数据，并生成一个简洁的摘要，或者指出其中有趣的模式和洞察。请重点关注关键信息、趋势或异常。

表格数据:
\`\`\`json
{{{json_data_string}}}
\`\`\``,
});

const dataInsightSummaryFlow = ai.defineFlow(
  {
    name: 'dataInsightSummaryFlow',
    inputSchema: DataInsightSummaryInputSchema,
    outputSchema: DataInsightSummaryOutputSchema,
  },
  async (input) => {
    // Stringify the data before passing it to the prompt
    const json_data_string = JSON.stringify(input.data, null, 2);
    const { output } = await prompt({ json_data_string });
    return output!;
  }
);
