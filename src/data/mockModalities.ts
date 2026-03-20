import type {
  FlashcardSet,
  Flashcard,
  Quiz,
  QuizQuestion,
  MindMap,
  MindMapNode,
} from '../types/domain'

const daysAgo = (d: number): string =>
  new Date(Date.now() - d * 86_400_000).toISOString()

/* ------------------------------------------------------------------ */
/*  Flashcard Sets                                                     */
/* ------------------------------------------------------------------ */

const fset1Cards: Flashcard[] = [
  {
    id: 'fc-1-1',
    front: 'What are the main levels at which gene expression is regulated?',
    back: 'Gene expression is regulated at chromatin remodelling, transcriptional initiation, mRNA processing, and post-transcriptional modification.',
    citationIds: ['cit-doc1-1'],
  },
  {
    id: 'fc-1-2',
    front: 'How far can enhancer elements act from a promoter?',
    back: 'Enhancer elements can act over distances of 100 kb or more to stimulate transcription.',
    citationIds: ['cit-doc1-2'],
  },
  {
    id: 'fc-1-3',
    front: 'What happens to the lac operon repressor when lactose is present?',
    back: 'Allolactose binds the repressor, causing a conformational change that releases it from the operator, allowing transcription to proceed.',
    citationIds: ['cit-doc1-3'],
  },
  {
    id: 'fc-1-4',
    front: 'What role does the catabolite activator protein (CAP) play in lac operon regulation?',
    back: 'CAP, activated by cyclic AMP, provides positive regulation by binding upstream of the promoter and enhancing RNA polymerase binding.',
    citationIds: ['cit-doc1-3'],
  },
  {
    id: 'fc-1-5',
    front: 'How does DNA methylation affect gene expression?',
    back: 'DNA methylation at CpG islands generally silences gene expression by preventing transcription factor binding and recruiting methyl-binding proteins that condense chromatin.',
    citationIds: ['cit-doc1-4'],
  },
  {
    id: 'fc-1-6',
    front: 'What is the general effect of histone acetylation on transcription?',
    back: 'Histone acetylation opens chromatin structure (euchromatin), making DNA more accessible to transcription machinery and promoting gene expression.',
    citationIds: ['cit-doc1-4'],
  },
  {
    id: 'fc-1-7',
    front: 'What is alternative splicing and why is it important?',
    back: 'Alternative splicing allows a single gene to produce multiple protein variants by selectively including or excluding exons, greatly expanding the proteome.',
    citationIds: ['cit-doc1-5'],
  },
  {
    id: 'fc-1-8',
    front: 'How do microRNAs regulate gene expression?',
    back: 'microRNAs guide the RNA-induced silencing complex (RISC) to complementary sequences on target mRNAs, leading to mRNA degradation or translational repression.',
    citationIds: ['cit-doc1-6'],
  },
  {
    id: 'fc-1-9',
    front: 'What are epigenetic modifications?',
    back: 'Epigenetic modifications are heritable changes to gene expression that do not alter the DNA sequence, including DNA methylation and histone modifications.',
    citationIds: ['cit-doc1-4'],
  },
  {
    id: 'fc-1-10',
    front: 'What is a CpG island?',
    back: 'A CpG island is a region of DNA with a high frequency of cytosine-guanine dinucleotides, often found near gene promoters and subject to methylation-based regulation.',
    citationIds: ['cit-doc1-4'],
  },
]

const fset2Cards: Flashcard[] = [
  {
    id: 'fc-2-1',
    front: 'What is the role of eIF4E in translation initiation?',
    back: 'eIF4E recognises and binds the 5\u2019 cap of mRNA, which is an essential first step in recruiting the ribosome to begin translation.',
    citationIds: ['cit-pan1-1'],
  },
  {
    id: 'fc-2-2',
    front: 'Describe the scanning model of translation initiation.',
    back: 'The 43S pre-initiation complex binds the 5\u2019 cap and scans along the mRNA until it finds the first AUG in a favourable Kozak context to begin translation.',
    citationIds: ['cit-pan1-1'],
  },
  {
    id: 'fc-2-3',
    front: 'What are the two subunits of the eukaryotic ribosome?',
    back: 'The 40S small subunit (decodes mRNA) and the 60S large subunit (catalyses peptide bond formation), forming an 80S complex.',
    citationIds: ['cit-pan1-2'],
  },
  {
    id: 'fc-2-4',
    front: 'Why is the ribosome considered a ribozyme?',
    back: 'Structural studies show the peptidyl transferase activity is carried out by ribosomal RNA, not protein, making the ribosome a catalytic RNA molecule.',
    citationIds: ['cit-pan1-2'],
  },
  {
    id: 'fc-2-5',
    front: 'What is the role of Hsp70 in protein folding?',
    back: 'Hsp70 is a molecular chaperone that binds hydrophobic regions of newly synthesised polypeptides, preventing misfolding and aggregation.',
    citationIds: ['cit-pan1-3'],
  },
  {
    id: 'fc-2-6',
    front: 'Name three common post-translational modifications.',
    back: 'Phosphorylation, glycosylation, and ubiquitination. These modifications regulate protein activity, localisation, and degradation.',
    citationIds: ['cit-pan1-4'],
  },
  {
    id: 'fc-2-7',
    front: 'What is the Kozak sequence?',
    back: 'The Kozak sequence is a consensus nucleotide sequence surrounding the AUG start codon that facilitates efficient translation initiation in eukaryotes.',
    citationIds: ['cit-pan1-1'],
  },
  {
    id: 'fc-2-8',
    front: 'How does ubiquitination affect a protein?',
    back: 'Ubiquitination tags proteins with ubiquitin molecules, most commonly targeting them for degradation by the 26S proteasome, thereby regulating protein half-life.',
    citationIds: ['cit-pan1-4'],
  },
]

const fset3Cards: Flashcard[] = [
  {
    id: 'fc-3-1',
    front: 'How are transcription and translation coordinated in eukaryotic cells?',
    back: 'Transcription in the nucleus determines which mRNAs are available, while translational regulation in the cytoplasm fine-tunes protein output, together ensuring precise gene expression.',
    citationIds: ['cit-syn1-1'],
  },
  {
    id: 'fc-3-2',
    front: 'What is the central dogma of molecular biology?',
    back: 'The central dogma describes the flow of genetic information from DNA to RNA (transcription) to protein (translation).',
    citationIds: ['cit-syn1-2'],
  },
  {
    id: 'fc-3-3',
    front: 'How do upstream open reading frames (uORFs) regulate translation?',
    back: 'uORFs are short coding sequences upstream of the main ORF that can reduce translation of the downstream protein by diverting ribosomes.',
    citationIds: ['cit-syn1-2'],
  },
  {
    id: 'fc-3-4',
    front: 'What is an internal ribosome entry site (IRES)?',
    back: 'An IRES is a structured RNA element that allows cap-independent translation initiation, enabling protein synthesis under conditions where cap-dependent translation is inhibited.',
    citationIds: ['cit-syn1-2'],
  },
  {
    id: 'fc-3-5',
    front: 'Describe negative feedback in gene regulatory networks.',
    back: 'In negative feedback, the protein product of a gene represses its own transcription, maintaining homeostatic expression levels and preventing overproduction.',
    citationIds: ['cit-syn1-3'],
  },
  {
    id: 'fc-3-6',
    front: 'How can positive feedback generate switch-like behaviour?',
    back: 'Positive feedback amplifies expression once a threshold is crossed, creating bistable systems where cells commit to one of two stable states, as seen in cell differentiation.',
    citationIds: ['cit-syn1-3'],
  },
  {
    id: 'fc-3-7',
    front: 'Why are autoregulatory loops important?',
    back: 'Autoregulatory loops allow proteins to control their own expression levels, providing rapid and precise adjustments that are critical for developmental timing and homeostasis.',
    citationIds: ['cit-syn1-3'],
  },
  {
    id: 'fc-3-8',
    front: 'What role do enhancer elements play in transcription regulation?',
    back: 'Enhancers are cis-regulatory DNA elements that increase transcription of target genes. They function over long distances and can act in an orientation-independent manner.',
    citationIds: ['cit-doc1-2'],
  },
  {
    id: 'fc-3-9',
    front: 'How do chaperone proteins relate to gene expression outcomes?',
    back: 'Chaperones ensure that the proteins produced by gene expression fold correctly, linking translational output to functional protein availability.',
    citationIds: ['cit-pan1-3'],
  },
  {
    id: 'fc-3-10',
    front: 'What is the relationship between chromatin structure and gene accessibility?',
    back: 'Open chromatin (euchromatin) allows transcription factors access to DNA, while condensed chromatin (heterochromatin) silences gene expression. Epigenetic modifications control this balance.',
    citationIds: ['cit-doc1-4'],
  },
]

export const flashcardSets: FlashcardSet[] = [
  {
    id: 'fset-1',
    scope: { level: 'asset', assetId: 'asset-doc-1' },
    title: 'Gene Expression Notes \u2014 Flashcards',
    cards: fset1Cards,
    createdAt: daysAgo(12),
    processingStatus: 'ready',
  },
  {
    id: 'fset-2',
    scope: { level: 'asset', assetId: 'asset-panopto-1' },
    title: 'Protein Synthesis Lecture \u2014 Flashcards',
    cards: fset2Cards,
    createdAt: daysAgo(10),
    processingStatus: 'ready',
  },
  {
    id: 'fset-3',
    scope: { level: 'studyset', studySetId: 'studyset-1', topicId: 'topic-1' },
    title: 'Week 3 Materials \u2014 Flashcards',
    cards: fset3Cards,
    createdAt: daysAgo(7),
    processingStatus: 'ready',
  },
]

/* ------------------------------------------------------------------ */
/*  Quizzes                                                            */
/* ------------------------------------------------------------------ */

const quiz1Questions: QuizQuestion[] = [
  {
    id: 'qq-1-1',
    questionText: 'Which of the following is NOT a level at which gene expression can be regulated?',
    options: [
      'Transcriptional initiation',
      'Chromatin remodelling',
      'Ribosome biosynthesis rate',
      'Post-transcriptional modification',
    ],
    correctIndex: 2,
    explanation: 'Ribosome biosynthesis rate is not typically described as a direct level of gene expression regulation. The primary levels include chromatin remodelling, transcription, and post-transcriptional processing.',
    citationIds: ['cit-doc1-1'],
  },
  {
    id: 'qq-1-2',
    questionText: 'Enhancer elements can act over distances of up to:',
    options: ['1 kb', '10 kb', '100 kb or more', '1 Mb exclusively'],
    correctIndex: 2,
    explanation: 'Enhancers can stimulate transcription from promoters located 100 kb or more away through chromatin looping mechanisms.',
    citationIds: ['cit-doc1-2'],
  },
  {
    id: 'qq-1-3',
    questionText: 'What molecule binds the lac repressor to release it from the operator?',
    options: ['Lactose', 'Allolactose', 'Glucose', 'cAMP'],
    correctIndex: 1,
    explanation: 'Allolactose, an isomer of lactose, is the actual inducer that binds the repressor and causes the conformational change releasing it from the operator.',
    citationIds: ['cit-doc1-3'],
  },
  {
    id: 'qq-1-4',
    questionText: 'DNA methylation at CpG islands generally results in:',
    options: [
      'Gene activation',
      'Gene silencing',
      'mRNA stabilisation',
      'Histone acetylation',
    ],
    correctIndex: 1,
    explanation: 'Methylation of CpG islands typically silences gene expression by blocking transcription factor binding and recruiting repressive complexes.',
    citationIds: ['cit-doc1-4'],
  },
  {
    id: 'qq-1-5',
    questionText: 'Histone acetylation is associated with:',
    options: [
      'Heterochromatin formation',
      'Gene silencing',
      'Open chromatin and active transcription',
      'DNA replication termination',
    ],
    correctIndex: 2,
    explanation: 'Acetylation of histone tails neutralises their positive charge, loosening chromatin structure and making DNA more accessible for transcription.',
    citationIds: ['cit-doc1-4'],
  },
  {
    id: 'qq-1-6',
    questionText: 'Alternative splicing primarily increases:',
    options: [
      'The number of genes in the genome',
      'The rate of DNA replication',
      'Proteomic diversity from a single gene',
      'The stability of mRNA transcripts',
    ],
    correctIndex: 2,
    explanation: 'By including or excluding specific exons, alternative splicing allows a single gene to encode multiple protein isoforms, greatly expanding the proteome.',
    citationIds: ['cit-doc1-5'],
  },
  {
    id: 'qq-1-7',
    questionText: 'microRNAs regulate gene expression by:',
    options: [
      'Enhancing transcription at the promoter',
      'Methylating histone tails',
      'Binding target mRNAs to induce degradation or translational repression',
      'Activating the lac operon',
    ],
    correctIndex: 2,
    explanation: 'microRNAs guide the RISC complex to complementary sequences in target mRNAs, leading to their degradation or translational repression.',
    citationIds: ['cit-doc1-6'],
  },
  {
    id: 'qq-1-8',
    questionText: 'The catabolite activator protein (CAP) provides what type of regulation for the lac operon?',
    options: [
      'Negative regulation',
      'Positive regulation',
      'Post-translational regulation',
      'Epigenetic regulation',
    ],
    correctIndex: 1,
    explanation: 'CAP, when bound to cAMP, acts as a positive regulator by binding near the promoter and enhancing RNA polymerase recruitment to the lac operon.',
    citationIds: ['cit-doc1-3'],
  },
  {
    id: 'qq-1-9',
    questionText: 'Epigenetic modifications are characterised by:',
    options: [
      'Changes to the DNA sequence itself',
      'Heritable changes in gene expression without altering DNA sequence',
      'Permanent and irreversible gene silencing',
      'Exclusive effects on prokaryotic organisms',
    ],
    correctIndex: 1,
    explanation: 'Epigenetic modifications such as DNA methylation and histone modifications alter gene expression without changing the underlying DNA sequence and can be inherited through cell division.',
    citationIds: ['cit-doc1-4'],
  },
  {
    id: 'qq-1-10',
    questionText: 'Which complex is guided by microRNAs to target mRNAs?',
    options: [
      'Spliceosome',
      'Proteasome',
      'RNA-induced silencing complex (RISC)',
      'Mediator complex',
    ],
    correctIndex: 2,
    explanation: 'The RNA-induced silencing complex (RISC) is guided by loaded microRNAs to complementary mRNA targets for post-transcriptional silencing.',
    citationIds: ['cit-doc1-6'],
  },
]

const quiz2Questions: QuizQuestion[] = [
  {
    id: 'qq-2-1',
    questionText: 'The eukaryotic translation initiation factor eIF4E recognises which mRNA feature?',
    options: ['Poly-A tail', '5\u2019 cap', 'Kozak sequence', 'IRES element'],
    correctIndex: 1,
    explanation: 'eIF4E specifically binds the 7-methylguanosine cap at the 5\u2019 end of mRNA, which is a critical step in cap-dependent translation initiation.',
    citationIds: ['cit-pan1-1'],
  },
  {
    id: 'qq-2-2',
    questionText: 'The eukaryotic ribosome sediments at:',
    options: ['70S', '60S', '80S', '100S'],
    correctIndex: 2,
    explanation: 'The complete eukaryotic ribosome has a sedimentation coefficient of 80S, composed of a 40S small subunit and a 60S large subunit.',
    citationIds: ['cit-pan1-2'],
  },
  {
    id: 'qq-2-3',
    questionText: 'The peptidyl transferase activity of the ribosome is performed by:',
    options: [
      'Ribosomal proteins',
      'Transfer RNA',
      'Ribosomal RNA',
      'Initiation factors',
    ],
    correctIndex: 2,
    explanation: 'Ribosomal RNA (specifically the 28S rRNA in the large subunit) catalyses peptide bond formation, making the ribosome a ribozyme.',
    citationIds: ['cit-pan1-2'],
  },
  {
    id: 'qq-2-4',
    questionText: 'Which chaperone protein binds hydrophobic regions of unfolded polypeptides?',
    options: ['Ubiquitin ligase', 'Hsp70', 'Proteasome', 'Signal peptidase'],
    correctIndex: 1,
    explanation: 'Hsp70 is a molecular chaperone that recognises and binds exposed hydrophobic patches on nascent polypeptides, preventing aggregation and assisting proper folding.',
    citationIds: ['cit-pan1-3'],
  },
  {
    id: 'qq-2-5',
    questionText: 'Ubiquitination most commonly targets proteins for:',
    options: [
      'Nuclear export',
      'Glycosylation',
      'Proteasomal degradation',
      'Membrane insertion',
    ],
    correctIndex: 2,
    explanation: 'Polyubiquitin chains (especially K48-linked) tag proteins for recognition and degradation by the 26S proteasome.',
    citationIds: ['cit-pan1-4'],
  },
  {
    id: 'qq-2-6',
    questionText: 'During translation initiation, the 43S complex scans the mRNA until it finds:',
    options: [
      'A stop codon',
      'The first AUG in a Kozak context',
      'An IRES element',
      'The poly-A tail',
    ],
    correctIndex: 1,
    explanation: 'In the scanning model, the 43S pre-initiation complex moves along the mRNA from the 5\u2019 cap until it encounters the first AUG start codon in a favourable Kozak sequence context.',
    citationIds: ['cit-pan1-1'],
  },
  {
    id: 'qq-2-7',
    questionText: 'Which of the following is a post-translational modification that can activate or inactivate enzymes?',
    options: [
      'Splicing',
      'Capping',
      'Phosphorylation',
      'Polyadenylation',
    ],
    correctIndex: 2,
    explanation: 'Phosphorylation adds a phosphate group to serine, threonine, or tyrosine residues, which can activate or inactivate enzyme function and is one of the most common regulatory modifications.',
    citationIds: ['cit-pan1-4'],
  },
  {
    id: 'qq-2-8',
    questionText: 'The small ribosomal subunit is primarily responsible for:',
    options: [
      'Peptide bond formation',
      'mRNA decoding',
      'Protein folding',
      'tRNA charging',
    ],
    correctIndex: 1,
    explanation: 'The 40S small subunit binds mRNA and is responsible for decoding the genetic message by matching codons to the anticodons of aminoacyl-tRNAs.',
    citationIds: ['cit-pan1-2'],
  },
]

export const quizzes: Quiz[] = [
  {
    id: 'quiz-1',
    scope: { level: 'asset', assetId: 'asset-doc-1' },
    title: 'Gene Expression Notes \u2014 Quiz',
    questions: quiz1Questions,
    createdAt: daysAgo(11),
    processingStatus: 'ready',
  },
  {
    id: 'quiz-2',
    scope: { level: 'asset', assetId: 'asset-panopto-1' },
    title: 'Protein Synthesis Lecture \u2014 Quiz',
    questions: quiz2Questions,
    createdAt: daysAgo(9),
    processingStatus: 'ready',
  },
]

/* ------------------------------------------------------------------ */
/*  Mind Maps                                                          */
/* ------------------------------------------------------------------ */

const mindmap1Nodes: MindMapNode[] = [
  // Root
  { id: 'mn-1-root', label: 'Gene Expression Notes', parentId: null },
  // Branch nodes from KT headings
  {
    id: 'mn-1-b1',
    label: 'Regulatory architecture of gene expression',
    parentId: 'mn-1-root',
    ktId: 'kt-doc1-1',
  },
  {
    id: 'mn-1-b2',
    label: 'Negative and positive control of the lac operon',
    parentId: 'mn-1-root',
    ktId: 'kt-doc1-2',
  },
  {
    id: 'mn-1-b3',
    label: 'Epigenetic modifications and chromatin remodelling',
    parentId: 'mn-1-root',
    ktId: 'kt-doc1-3',
  },
  {
    id: 'mn-1-b4',
    label: 'Post-transcriptional regulation and alternative splicing',
    parentId: 'mn-1-root',
    ktId: 'kt-doc1-4',
  },
  // Leaf nodes — key terms
  { id: 'mn-1-l1', label: 'Enhancers', parentId: 'mn-1-b1' },
  { id: 'mn-1-l2', label: 'Silencers', parentId: 'mn-1-b1' },
  { id: 'mn-1-l3', label: 'Promoter elements', parentId: 'mn-1-b1' },
  { id: 'mn-1-l4', label: 'Lac repressor', parentId: 'mn-1-b2' },
  { id: 'mn-1-l5', label: 'Allolactose', parentId: 'mn-1-b2' },
  { id: 'mn-1-l6', label: 'cAMP-CAP complex', parentId: 'mn-1-b2' },
  { id: 'mn-1-l7', label: 'DNA methylation', parentId: 'mn-1-b3' },
  { id: 'mn-1-l8', label: 'Histone acetylation', parentId: 'mn-1-b3' },
  { id: 'mn-1-l9', label: 'CpG islands', parentId: 'mn-1-b3' },
  { id: 'mn-1-l10', label: 'Exon skipping', parentId: 'mn-1-b4' },
  { id: 'mn-1-l11', label: 'microRNAs', parentId: 'mn-1-b4' },
  { id: 'mn-1-l12', label: 'RISC complex', parentId: 'mn-1-b4' },
]

export const mindMaps: MindMap[] = [
  {
    id: 'mindmap-1',
    scope: { level: 'asset', assetId: 'asset-doc-1' },
    title: 'Gene Expression Notes \u2014 Mind Map',
    nodes: mindmap1Nodes,
    createdAt: daysAgo(10),
  },
]
