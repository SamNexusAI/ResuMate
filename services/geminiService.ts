import { OptimizationResult, PlanLevel } from '../types';

// Mock response generation for demo/development when no API key is present
const generateMockResponse = (plan: PlanLevel, originalText: string) => {
    const baseEnhancement = "Results-oriented professional with a proven track record of success.";

    if (plan === 'free') {
        return `[FREE PREVIEW]\n\n${originalText}\n\nKey Improvements needed:\n- Add more metrics\n- Use stronger action verbs\n- Fix formatting consistency`;
    }

    return `PROFESSIONAL SUMMARY\n${baseEnhancement} Leverages data-driven strategies to drive efficiency and growth. Expert in cross-functional collaboration and project management.\n\nEXPERIENCE\n\nSenior Role | Tech Corp | 2020 - Present\n- Spearheaded key initiatives resulting in 40% efficiency increase.\n- Led a team of 15 professionals, fostering a culture of innovation.\n- Managed budget of $500k, optimizing resource allocation.\n\nEDUCATION\n\nBS Field of Study | University Name | 2016 - 2020\n\nSKILLS\n- Leadership\n- Project Management\n- Data Analysis\n- Strategic Planning`;
};

export const optimizeResumeWithGemini = async (
    resumeText: string,
    jobDescription: string,
    plan: PlanLevel,
    onStream: (text: string) => void
): Promise<OptimizationResult> => {

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    // Simulation delay
    await new Promise(resolve => setTimeout(resolve, 800));

    if (!apiKey && plan !== 'free') {
        // If no API key, simulate streaming response
        const mockContent = generateMockResponse(plan, resumeText);
        const chunks = mockContent.split(' ');
        let currentText = '';

        for (let i = 0; i < chunks.length; i++) {
            currentText += (i > 0 ? ' ' : '') + chunks[i];
            onStream(currentText);
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        return {
            optimizedContent: mockContent,
            planUsed: plan,
            timestamp: Date.now(),
            atsScore: plan === 'ultimate' ? 85 : undefined,
            coverLetter: plan === 'ultimate' ? "Dear Hiring Manager,\n\nI am excited to apply..." : undefined
        };
    }

    // Real implementation would go here using @google/genai
    // For now, we fall back to mock to ensure the app runs without config
    const mockContent = generateMockResponse(plan, resumeText);
    onStream(mockContent);

    return {
        optimizedContent: mockContent,
        planUsed: plan,
        timestamp: Date.now(),
        atsScore: Math.floor(Math.random() * 20) + 70, // Mock score
    };
};
