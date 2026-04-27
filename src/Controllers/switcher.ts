import { Request, Response } from 'express';
import { extronPort } from '../util/extronPort';

// Extron SIS: query active input for output 1 → `1%` → responds with input number
export const getStatus = async (_req: Request, res: Response): Promise<void> => {
  try {
    if (!extronPort.connected) {
      res.status(503).json({ error: 'Extron IN1808 not connected' });
      return;
    }
    const response = await extronPort.writeAndRead('1%');
    const inputNum = parseInt(response.trim(), 10);
    if (isNaN(inputNum)) {
      res.status(500).json({ error: 'Unexpected response from switcher', raw: response });
      return;
    }
    res.status(200).json({ input: inputNum, connected: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// Extron SIS: route input N to output 1 → `N*1!` → responds with "Out1 InN All"
export const selectInput = async (req: Request, res: Response): Promise<void> => {
  const inputNum = parseInt(req.params.inputNum, 10);
  if (isNaN(inputNum) || inputNum < 1 || inputNum > 8) {
    res.status(400).json({ error: 'Input must be 1–8' });
    return;
  }
  try {
    if (!extronPort.connected) {
      res.status(503).json({ error: 'Extron IN1808 not connected' });
      return;
    }
    // Response is "Out1 In<N> All" — parse the input number from it
    const response = await extronPort.writeAndRead(`${inputNum}*1!`);
    const match = response.match(/In(\d+)/i);
    const confirmed = match ? parseInt(match[1], 10) : inputNum;
    res.status(200).json({ input: confirmed });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
