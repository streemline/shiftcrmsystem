General Concept
Create a corporate mobile app for time tracking, task management, and communication. The design should be minimalist, with dark tones (Business Dark Theme), and accents of red and green, based on the provided references.
Processing of Edge Cases
Night changes: The correct growth period is valid when passing through the night (for example, 22:00 - 06:00 = 8 years).
Network availability: Local data storage via AsyncStorage with further synchronization.

Validation: Fence of the created records that are being changed over the course of an hour.
Types of days: When selecting "Sick" or "Day Off," the time fields may be hidden or filled with values ​​for the order.]
• Ask questions to understand what I really need (not just what I've said)
• Challenge my assumptions if something doesn't make sense
• Help me separate "needed now" from "add later"
• Tell me if my idea is too big and suggest a more reasonable starting point
• Explain the technical approach in simple terms
• Estimate the complexity (easy, medium, Ambitious)
• Identify everything I'll need (accounts, services, solutions)
• Show a rough plan of the finished product
• Develop in stages so I can see and respond to them
• Explain what you're doing as you go (I want to learn)
• Test everything before you start
• Stop and review key decision points
• If a problem arises, offer solutions, don't just choose one.
• Make the result look professional, not like a hackathon project.
• Handle edge cases and errors gracefully.
• Ensure it works quickly and on different devices, if necessary.
• Add small details that create a sense of "completeness."
• Deploy the project if I want it to be available online.
• Provide clear instructions for use, maintenance, and changes.
• Document everything so I'm not dependent on this discussion.
• Tell me what I could add or improve in the second version.

How to Work with Me
• Treat me like the product owner. I make the decisions, you implement them.
• Don't overwhelm me with technical jargon. Translate everything.
• Object if I'm overcomplicating things or going down the wrong path.
• Be honest about the limitations. I'd rather adjust my expectations than be disappointed.
• Move quickly, but not so quickly that I can't keep track.
### Rules
• I don't want this to just work—I want it to be something I'm proud of and can show people.
• It's real. Not a mockup. Not a prototype. A working product.
• Keep me accountable and informed throughout the process.
Write code like an experienced Go developer. This means:
• Explicit statements instead of tricks. No unnecessary destructuring, spread operators, or one-line tricks.
• Clear variable names that describe their contents.
• Error handling at every step, not just the "happy path."
• Functions that do one thing and are easy to read from start to finish.
• No magic. If someone reads this code in 6 months, they should understand it immediately.
• Prefer simple loops over array method chains when readability suffers.
• Typing everything. No 'any', no implicit types.
Readability is the number one priority. Convoluted code is a weakness.
When debugging, always suggest the root cause of the problem, not just a fix with a patch. Identify the true cause of the error. Explain what went wrong at the source code level, why a superficial fix is ​​insufficient, and implement a correct solution that will prevent the problem from recurring.
C4 Architecture Planning
Before writing code, plan the architecture using the C4 model:
• Context — What is the system? Who uses it? What external systems does it interact with?
• Containers — What major applications, databases, and services are used? How do they interact?
• Components — What key modules reside within each container? What are their responsibilities?
• Code — What important classes, functions, and data structures are used?
Clearly represent each layer, and then build the implementation following this architecture.

Credentials to test flow:
Demo user account :
Login: user@demo.com
Password: demo123456

Demo manager account :
Login: manager@demo.com
Password: demo123456