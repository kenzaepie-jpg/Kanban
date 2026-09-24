import { Course, Topic } from '../types';
import { toLocalISODate } from '../utils/dates';

export const SAMPLE_COURSES: Course[] = [
  {
    id: 'course-bio-101',
    title: 'Cellular Biology & Genetics Final',
    code: 'BIO-101',
    description: 'Comprehensive exam covering molecular genetics, cellular respiration, and cell division.',
    examDate: toLocalISODate(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)), // 5 days from now
    color: '#059669', // Emerald
    createdAt: new Date().toISOString(),
  },
  {
    id: 'course-cs-401',
    title: 'Distributed Systems & Cloud Architecture',
    code: 'CS-401',
    description: 'Midterm exam covering consensus protocols, RPCs, replication, and CAP theorem.',
    examDate: toLocalISODate(new Date(Date.now() + 8 * 24 * 60 * 60 * 1000)), // 8 days from now
    color: '#4f46e5', // Indigo
    createdAt: new Date().toISOString(),
  },
  {
    id: 'course-law-202',
    title: 'Constitutional Law & Civil Liberties',
    code: 'LAW-202',
    description: 'Judicial review, commerce clause, 14th amendment substantive due process.',
    examDate: toLocalISODate(new Date(Date.now() + 12 * 24 * 60 * 60 * 1000)), // 12 days from now
    color: '#d97706', // Amber
    createdAt: new Date().toISOString(),
  },
];

export const SAMPLE_TOPICS: Topic[] = [
  // Course 1: Biology Topics
  {
    id: 'bio-t1',
    courseId: 'course-bio-101',
    title: '1. Cellular Respiration & ATP Synthesis',
    order: 1,
    status: 'done',
    priority: 'high',
    estimatedMinutes: 30,
    summary: 'Glycolysis in cytoplasm, Krebs cycle in mitochondrial matrix, and oxidative phosphorylation yielding ~30-32 ATP per glucose molecule.',
    confidenceScore: 4,
    document: {
      id: 'doc-bio-1',
      name: 'Lecture_04_Respiration_Guide.docx',
      type: 'docx',
      size: 42500,
      content: `<h2>Lecture 4: Cellular Respiration & ATP Pathways</h2>
<p><strong>Overview:</strong> Cellular respiration is the chemical process through which cells break down glucose to generate adenosine triphosphate (ATP), the primary energy currency of biological organisms.</p>
<h3>1. Glycolysis (Cytosol)</h3>
<p>Anaerobic conversion of 1 glucose molecule (6-carbon) into 2 pyruvate molecules (3-carbon). Generates a net yield of <strong>2 ATP</strong> via substrate-level phosphorylation and <strong>2 NADH</strong>.</p>
<ul>
  <li>Key regulatory enzyme: <em>Phosphofructokinase (PFK)</em>, inhibited by high ATP levels and activated by AMP.</li>
  <li>Does not require oxygen.</li>
</ul>
<h3>2. Pyruvate Oxidation & The Krebs Cycle (Mitochondrial Matrix)</h3>
<p>Each pyruvate is converted into Acetyl-CoA, releasing CO₂ and generating NADH. Acetyl-CoA combines with oxaloacetate (4C) to form citrate (6C).</p>
<ul>
  <li>Yield per glucose (2 turns): 6 NADH, 2 FADH₂, 2 ATP/GTP, 4 CO₂.</li>
</ul>
<h3>3. Oxidative Phosphorylation & Electron Transport Chain (Inner Membrane)</h3>
<p>Electrons from NADH and FADH₂ are transferred through Complexes I-IV, pumping protons (H⁺) into the intermembrane space to create an electrochemical proton gradient.</p>
<p><em>Chemiosmosis:</em> ATP Synthase harnesses proton motive force as H⁺ flows back into the matrix, generating ~26-28 ATP.</p>
<hr />
<p><strong>Exam Tip:</strong> Understand the difference between substrate-level vs oxidative phosphorylation!</p>`,
    },
    keyConcepts: [
      { id: 'c1', text: 'Substrate-level phosphorylation vs Oxidative phosphorylation', completed: true },
      { id: 'c2', text: 'Role of Phosphofructokinase as a rate-limiting enzyme', completed: true },
      { id: 'c3', text: 'Proton-motive force across the inner mitochondrial membrane', completed: true },
      { id: 'c4', text: 'Total theoretical ATP yield per glucose molecule (~30-32)', completed: true },
    ],
    personalNotes: 'Remember PFK is inhibited by ATP and citrate, stimulated by AMP.',
    lastStudiedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    completedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
  },
  {
    id: 'bio-t2',
    courseId: 'course-bio-101',
    title: '2. DNA Replication & Repair Mechanisms',
    order: 2,
    status: 'in-progress',
    priority: 'high',
    estimatedMinutes: 25,
    summary: 'Semi-conservative replication fork, leading vs lagging strand Okazaki fragments, and mismatch/excision repair systems.',
    confidenceScore: 3,
    document: {
      id: 'doc-bio-2',
      name: 'Chapter_12_DNA_Replication.pdf',
      type: 'pdf',
      size: 104500,
      pageCount: 14,
      content: `<h2>Chapter 12: DNA Replication & Fidelity</h2>
<p><strong>Core Concept:</strong> DNA replication is <em>semiconservative</em>, meaning each newly formed double helix consists of one conserved parental strand and one newly synthesized daughter strand (proven by the Meselson-Stahl experiment).</p>
<h3>The Replication Fork Machinery</h3>
<ul>
  <li><strong>Helicase:</strong> Unwinds the double helix at replication origins by breaking hydrogen bonds.</li>
  <li><strong>Single-Strand Binding Proteins (SSBs):</strong> Stabilize single strands to prevent premature reannealing.</li>
  <li><strong>Topoisomerase (Gyrase):</strong> Relieves supercoiling and torsional strain ahead of the fork.</li>
  <li><strong>Primase:</strong> Synthesizes short complementary RNA primers (~10 nucleotides) providing the essential 3'-OH end.</li>
  <li><strong>DNA Polymerase III:</strong> Synthesizes new DNA strand in the 5' → 3' direction with 3' → 5' exonuclease proofreading activity.</li>
  <li><strong>DNA Polymerase I:</strong> Removes RNA primers and fills the resulting gaps with deoxyribonucleotides.</li>
  <li><strong>DNA Ligase:</strong> Seals nicks in the sugar-phosphate backbone by forming phosphodiester bonds.</li>
</ul>
<h3>Leading vs. Lagging Strand Synthesis</h3>
<p>Because DNA polymerase can only synthesize in the 5' to 3' direction, the lagging strand is synthesized discontinuously as short segments called <strong>Okazaki fragments</strong>.</p>
<h3>DNA Repair Pathways</h3>
<ul>
  <li><strong>Mismatch Repair (MMR):</strong> Corrects errors that escape polymerase proofreading immediately after replication.</li>
  <li><strong>Nucleotide Excision Repair (NER):</strong> Repairs bulky UV-induced thymine dimers via excinuclease excision.</li>
</ul>`,
    },
    keyConcepts: [
      { id: 'c5', text: '5\' to 3\' synthesis polarity and Okazaki fragment ligation', completed: true },
      { id: 'c6', text: 'Proofreading 3\' to 5\' exonuclease activity of DNA Pol III', completed: true },
      { id: 'c7', text: 'Nucleotide excision repair for UV-induced thymine dimers', completed: false },
      { id: 'c8', text: 'Telomeres and telomerase function in linear chromosomes', completed: false },
    ],
    personalNotes: 'Focus on drawing the replication fork showing leading strand pointing into fork.',
    lastStudiedAt: new Date().toISOString(),
  },
  {
    id: 'bio-t3',
    courseId: 'course-bio-101',
    title: '3. Transcription & RNA Processing in Eukaryotes',
    order: 3,
    status: 'not-done',
    priority: 'high',
    estimatedMinutes: 20,
    summary: 'RNA Polymerase II transcription, 5\' 7-methylguanosine capping, 3\' polyadenylation, and spliceosome alternative splicing.',
    confidenceScore: 0,
    document: {
      id: 'doc-bio-3',
      name: 'Lecture_07_Transcription_Notes.docx',
      type: 'docx',
      size: 58200,
      content: `<h2>Lecture 7: Eukaryotic Transcription & Post-Transcriptional Modification</h2>
<p>Unlike prokaryotes, eukaryotic pre-mRNA undergoes extensive processing in the nucleus before nuclear export and translation in the cytoplasm.</p>
<h3>1. Transcription Stages</h3>
<ul>
  <li><strong>Initiation:</strong> Transcription factors bind to the TATA box promoter region, recruiting RNA Polymerase II.</li>
  <li><strong>Elongation:</strong> RNA Pol II synthesizes pre-mRNA unwinding DNA template strand.</li>
  <li><strong>Termination:</strong> Polyadenylation signal sequence triggers cleavage of the nascent RNA transcript.</li>
</ul>
<h3>2. Pre-mRNA Processing Steps</h3>
<ol>
  <li><strong>5' Cap Addition:</strong> Addition of 7-methylguanosine cap protects against 5' exonuclease degradation and facilitates ribosome recognition.</li>
  <li><strong>3' Poly-A Tail:</strong> Cleavage and addition of ~150-250 adenine residues by poly-A polymerase for stability and export.</li>
  <li><strong>Intron Splicing:</strong> The spliceosome (snRNPs) excises non-coding introns and splices coding exons together.</li>
</ol>
<p><strong>Alternative Splicing:</strong> Allows a single gene to encode multiple protein isoforms, greatly increasing proteomic diversity without increasing genome size.</p>`,
    },
    keyConcepts: [
      { id: 'c9', text: 'Promoter recognition & TATA-binding protein', completed: false },
      { id: 'c10', text: '5\' cap and 3\' poly-A tail biochemical functions', completed: false },
      { id: 'c11', text: 'Mechanism of spliceosome and lariat formation', completed: false },
      { id: 'c12', text: 'Alternative splicing yielding multiple protein isoforms', completed: false },
    ],
    personalNotes: '',
  },
  {
    id: 'bio-t4',
    courseId: 'course-bio-101',
    title: '4. Translation & Protein Synthesis',
    order: 4,
    status: 'not-done',
    priority: 'medium',
    estimatedMinutes: 20,
    summary: 'Ribosomal A, P, and E sites, tRNA charging by aminoacyl-tRNA synthetase, initiation, elongation, and release factors.',
    confidenceScore: 0,
    document: {
      id: 'doc-bio-4',
      name: 'StudyGuide_Translation_Code.pdf',
      type: 'pdf',
      size: 78000,
      pageCount: 8,
      content: `<h2>Study Guide: Ribosome Function & Translation</h2>
<p>Translation translates the genetic code within mRNA into an amino acid sequence.</p>
<h3>Ribosome Architecture</h3>
<p>The ribosome has three primary tRNA binding sites:</p>
<ul>
  <li><strong>A Site (Aminoacyl):</strong> Binds the incoming aminoacyl-tRNA carrying the next amino acid.</li>
  <li><strong>P Site (Peptidyl):</strong> Holds the tRNA carrying the growing polypeptide chain. Peptidyl transferase catalyzes peptide bond formation.</li>
  <li><strong>E Site (Exit):</strong> Discharges the deacylated tRNA.</li>
</ul>
<h3>Key Phases</h3>
<p>1. <strong>Initiation:</strong> Small ribosomal subunit binds mRNA 5' cap and scans for AUG start codon (methionine). Large subunit docks.</p>
<p>2. <strong>Elongation:</strong> EF-Tu delivers tRNA; peptidyl transferase forms peptide bond; EF-G translocates ribosome along mRNA by one codon (3 nucleotides).</p>
<p>3. <strong>Termination:</strong> Stop codons (UAA, UAG, UGA) are recognized by Release Factors (RF), terminating synthesis and releasing polypeptide.</p>`,
    },
    keyConcepts: [
      { id: 'c13', text: 'A, P, and E site cycle during elongation', completed: false },
      { id: 'c14', text: 'Aminoacyl-tRNA synthetase high-fidelity charging', completed: false },
      { id: 'c15', text: 'Stop codons: UAA, UAG, UGA and release factors', completed: false },
    ],
    personalNotes: '',
  },
  {
    id: 'bio-t5',
    courseId: 'course-bio-101',
    title: '5. Mendelian & Non-Mendelian Inheritance',
    order: 5,
    status: 'not-done',
    priority: 'medium',
    estimatedMinutes: 25,
    summary: 'Monohybrid/dihybrid crosses, incomplete dominance, codominance, epistasis, sex-linked traits, and pedigree analysis.',
    confidenceScore: 0,
    document: {
      id: 'doc-bio-5',
      name: 'Genetics_Problem_Set.docx',
      type: 'docx',
      size: 61000,
      content: `<h2>Genetics Problem Set & Conceptual Review</h2>
<h3>1. Mendel's Fundamental Laws</h3>
<ul>
  <li><strong>Law of Segregation:</strong> Two alleles for a trait segregate during gamete formation so each gamete carries one allele.</li>
  <li><strong>Law of Independent Assortment:</strong> Genes on non-homologous chromosomes assort independently during meiosis I metaphase.</li>
</ul>
<h3>2. Deviations from Simple Dominance</h3>
<ul>
  <li><strong>Incomplete Dominance:</strong> Heterozygote displays an intermediate phenotype (e.g., Red x White snapdragons = Pink, ratio 1:2:1).</li>
  <li><strong>Codominance:</strong> Both alleles are fully expressed (e.g., AB blood type with both IA and IB surface antigens).</li>
  <li><strong>Epistasis:</strong> One gene alters the phenotypic expression of a second independent gene (e.g., Labrador coat color).</li>
  <li><strong>Sex-Linked (X-linked):</strong> Recessive traits appear more frequently in males (XY) due to hemizygosity (e.g., hemophilia, red-green colorblindness).</li>
</ul>`,
    },
    keyConcepts: [
      { id: 'c16', text: 'Dihybrid cross 9:3:3:1 ratio and assumptions', completed: false },
      { id: 'c17', text: 'Distinguishing incomplete dominance vs codominance', completed: false },
      { id: 'c18', text: 'X-linked recessive pedigree inheritance patterns', completed: false },
    ],
    personalNotes: '',
  },

  // Course 2: Distributed Systems Topics
  {
    id: 'cs-t1',
    courseId: 'course-cs-401',
    title: '1. CAP Theorem & PACELC Trade-offs',
    order: 1,
    status: 'done',
    priority: 'high',
    estimatedMinutes: 25,
    summary: 'Brewer\'s conjecture, network partitions, consistency models (strong, linearizable, eventual), and latency tradeoffs.',
    confidenceScore: 5,
    document: {
      id: 'doc-cs-1',
      name: 'CAP_and_PACELC_Review.pdf',
      type: 'pdf',
      size: 92000,
      pageCount: 11,
      content: `<h2>CAP Theorem & PACELC Architecture Guide</h2>
<p>In any asynchronous distributed data store, you cannot simultaneously provide more than two out of three guarantees: <strong>Consistency (Linearizability)</strong>, <strong>Availability</strong>, and <strong>Partition Tolerance</strong>.</p>
<h3>Understanding Network Partitions (P)</h3>
<p>Network partitions (dropped packets, severed cables, routing loops) are inevitable in real-world distributed networks. Therefore, systems must choose between:</p>
<ul>
  <li><strong>CP Systems:</strong> Prioritize consistency. When a partition occurs, nodes reject writes or fail rather than serve stale/inconsistent data (e.g., etcd, ZooKeeper, Spanner).</li>
  <li><strong>AP Systems:</strong> Prioritize availability. When partitioned, all nodes accept reads and writes, achieving eventual consistency via reconciliation (e.g., Cassandra, DynamoDB).</li>
</ul>
<h3>The PACELC Theorem Extension</h3>
<p>Even when there is NO partition (<strong>Else</strong>), there is a fundamental tradeoff between <strong>Latency (L)</strong> and <strong>Consistency (C)</strong>. For instance, MongoDB is PC/EC, while Cassandra is PA/EL.</p>`,
    },
    keyConcepts: [
      { id: 'cs-c1', text: 'Why Partition Tolerance is non-negotiable in networks', completed: true },
      { id: 'cs-c2', text: 'Linearizability vs Eventual Consistency', completed: true },
      { id: 'cs-c3', text: 'PACELC taxonomy applied to real production databases', completed: true },
    ],
    personalNotes: 'Spanner uses TrueTime atomic clocks to provide externally consistent reads with high availability.',
    lastStudiedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    completedAt: new Date(Date.now() - 3600000 * 40).toISOString(),
  },
  {
    id: 'cs-t2',
    courseId: 'course-cs-401',
    title: '2. The Raft Consensus Algorithm',
    order: 2,
    status: 'in-progress',
    priority: 'high',
    estimatedMinutes: 35,
    summary: 'Leader election, log replication, safety invariants, randomized election timeouts, and joint consensus configuration changes.',
    confidenceScore: 3,
    document: {
      id: 'doc-cs-2',
      name: 'Raft_In_Search_of_Understandable_Consensus.pdf',
      type: 'pdf',
      size: 154000,
      pageCount: 18,
      content: `<h2>The Raft Consensus Protocol</h2>
<p>Raft decomposes consensus into three independent sub-problems: <em>Leader Election</em>, <em>Log Replication</em>, and <em>Safety</em>.</p>
<h3>1. Server States</h3>
<p>At any given time, each server is in one of three states: <strong>Leader</strong>, <strong>Follower</strong>, or <strong>Candidate</strong>.</p>
<h3>2. Leader Election</h3>
<ul>
  <li>Followers expect periodic heartbeats (AppendEntries RPC) from the leader.</li>
  <li>If election timeout elapses (randomized between 150ms-300ms to prevent split votes), follower increments term and transitions to Candidate.</li>
  <li>Candidate votes for itself and broadcasts RequestVote RPCs to all peers.</li>
  <li>Requires a strict majority of votes (quorum: N/2 + 1) to claim leadership.</li>
</ul>
<h3>3. Log Replication</h3>
<p>Leader receives client commands, appends them to its log, and issues AppendEntries RPCs. Once an entry is committed by a majority, leader applies it to state machine and responds to client.</p>
<h3>4. Raft Safety Properties</h3>
<ul>
  <li><strong>Election Safety:</strong> At most one leader can be elected in a given term.</li>
  <li><strong>Leader Append-Only:</strong> A leader never overwrites or truncates its own log.</li>
  <li><strong>Log Matching Property:</strong> If two logs contain an entry with the same index and term, then the logs are identical in all entries up through the given index.</li>
  <li><strong>Leader Completeness:</strong> If a log entry is committed in a given term, that entry will be present in the logs of the leaders for all higher terms.</li>
</ul>`,
    },
    keyConcepts: [
      { id: 'cs-c4', text: 'Randomized election timeouts avoiding split votes', completed: true },
      { id: 'cs-c5', text: 'AppendEntries RPC handling and log consistency check', completed: false },
      { id: 'cs-c6', text: 'Candidate vote restriction (log is at least as up-to-date as receiver)', completed: false },
      { id: 'cs-c7', text: 'Log compaction via state snapshots', completed: false },
    ],
    personalNotes: 'Crucial rule: A candidate only gets a vote if its log is at least as up-to-date as the voter\'s log!',
    lastStudiedAt: new Date().toISOString(),
  },
  {
    id: 'cs-t3',
    courseId: 'course-cs-401',
    title: '3. Vector Clocks & Causal Consistency',
    order: 3,
    status: 'not-done',
    priority: 'medium',
    estimatedMinutes: 20,
    summary: 'Logical time, Lamport timestamps, happens-before relation (→), detecting concurrent events and conflict resolution.',
    confidenceScore: 0,
    document: {
      id: 'doc-cs-3',
      name: 'Lecture_Logical_Clocks_Vector.docx',
      type: 'docx',
      size: 44000,
      content: `<h2>Lecture: Logical Clocks & Vector Time</h2>
<p>Physical clocks cannot be perfectly synchronized across distributed machines due to clock skew and network jitter.</p>
<h3>Lamport Timestamps</h3>
<p>Assigns a monotonically increasing scalar counter to each event. Defines the happens-before relation: if a → b, then L(a) &lt; L(b). However, the converse is NOT true (L(a) &lt; L(b) does NOT imply a → b).</p>
<h3>Vector Clocks</h3>
<p>Each node maintains an array of clocks V where V[i] is the logical time at process i.</p>
<ul>
  <li>Before event, process i increments V[i].</li>
  <li>When sending message m, node attaches its vector V.</li>
  <li>Upon receiving (m, V_msg), process updates: V[k] = max(V[k], V_msg[k]) for all k, then increments V[i].</li>
</ul>
<p><strong>Detecting Concurrency:</strong> If neither V(a) ≤ V(b) nor V(b) ≤ V(a), events a and b are <em>concurrent</em> (a || b), revealing conflict.</p>`,
    },
    keyConcepts: [
      { id: 'cs-c8', text: 'Lamport total ordering vs partial ordering', completed: false },
      { id: 'cs-c9', text: 'Vector clock update algorithm rules', completed: false },
      { id: 'cs-c10', text: 'Determining concurrent writes and version branching', completed: false },
    ],
    personalNotes: '',
  },
];
