// A small ready-made course so a new student can try the study board straight away.

const LESSONS: { title: string; html: string }[] = [
  {
    title: 'What is Agile?',
    html: `<h1>What is Agile?</h1>
<p>Agile is a way of building software in small, frequent steps instead of one big delivery at the end. Teams plan a little, build a little, show the result, and adjust.</p>
<h2>The four values of the Agile Manifesto</h2>
<ul>
<li><strong>Individuals and interactions</strong> over processes and tools</li>
<li><strong>Working software</strong> over comprehensive documentation</li>
<li><strong>Customer collaboration</strong> over contract negotiation</li>
<li><strong>Responding to change</strong> over following a plan</li>
</ul>
<p>The items on the right still matter; Agile teams simply value the items on the left more.</p>
<h2>Why it works</h2>
<p>Short feedback loops expose mistakes early, when they are cheap to fix. Customers see progress every few weeks and can change priorities as they learn what they really need.</p>`,
  },
  {
    title: 'Scrum in a nutshell',
    html: `<h1>Scrum in a nutshell</h1>
<p>Scrum organises work into fixed-length <strong>sprints</strong>, usually two weeks long.</p>
<h2>Roles</h2>
<ul>
<li><strong>Product Owner</strong> — owns the product backlog and decides what is most valuable.</li>
<li><strong>Scrum Master</strong> — removes blockers and coaches the team on the process.</li>
<li><strong>Developers</strong> — build the increment each sprint.</li>
</ul>
<h2>Events</h2>
<ol>
<li>Sprint Planning — choose the sprint goal and backlog items.</li>
<li>Daily Scrum — a 15-minute sync on progress and blockers.</li>
<li>Sprint Review — demo the increment to stakeholders.</li>
<li>Sprint Retrospective — improve how the team works.</li>
</ol>`,
  },
  {
    title: 'Kanban and WIP limits',
    html: `<h1>Kanban and WIP limits</h1>
<p>Kanban visualises work as cards moving across columns such as <em>To Do → In Progress → Done</em>.</p>
<h2>Work-in-progress (WIP) limits</h2>
<p>A WIP limit caps how many items may sit in a column at once. When the column is full, you must <strong>finish</strong> something before you <strong>start</strong> something new.</p>
<p>That is exactly how GO STUDY works: your study board holds one course at a time, so you finish a course (or deliberately end its session) before picking up the next one.</p>
<h2>Benefits</h2>
<ul>
<li>Less context switching and multitasking</li>
<li>Bottlenecks become visible</li>
<li>Work flows to completion faster</li>
</ul>`,
  },
  {
    title: 'User stories and estimation',
    html: `<h1>User stories and estimation</h1>
<p>A user story describes a feature from the user's point of view:</p>
<blockquote>As a <em>student</em>, I want to <em>track my reading progress</em> so that <em>I know how close I am to finishing a course</em>.</blockquote>
<h2>INVEST</h2>
<p>Good stories are Independent, Negotiable, Valuable, Estimable, Small and Testable.</p>
<h2>Story points</h2>
<p>Teams estimate relative effort with story points (often Fibonacci numbers: 1, 2, 3, 5, 8, 13). Planning poker helps the team agree on an estimate while surfacing hidden assumptions.</p>`,
  },
];

export const SAMPLE_COURSE = {
  title: 'Introduction to Agile',
  code: 'SWE-201',
  color: '#2563eb',
  lessons: LESSONS,
};
