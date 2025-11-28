import React from 'react'
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';


const Test = async () => {

    const { text } = await generateText({
  model: google('gemini-2.5-flash'),
  prompt: 'Write a vegetarian lasagna recipe for 4 people.',
}); 
    return (
        <div>
            <h1>Test</h1>
            <p>{text}</p>
        </div>
    )
}

export default Test
