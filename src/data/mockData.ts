import type {
  Topic,
  LearningAsset,
  Citation,
  KnowledgeTouchpoint,
  StudySet,
} from '../types/domain'

/* ------------------------------------------------------------------ */
/*  Helper: relative ISO dates                                         */
/* ------------------------------------------------------------------ */
const daysAgo = (d: number): string =>
  new Date(Date.now() - d * 86_400_000).toISOString()

/* ------------------------------------------------------------------ */
/*  Topics                                                             */
/* ------------------------------------------------------------------ */
export const topics: Topic[] = [
  {
    id: 'topic-1',
    name: 'Molecular Genetics',
    archived: false,
    createdAt: daysAgo(60),
  },
  {
    id: 'topic-2',
    name: 'Organic Chemistry',
    archived: false,
    createdAt: daysAgo(42),
  },
  {
    id: 'topic-3',
    name: 'Cell Biology',
    archived: false,
    createdAt: daysAgo(21),
  },
  {
    id: 'topic-4',
    name: 'Biochemistry 101',
    archived: true,
    createdAt: daysAgo(120),
  },
  {
    id: 'topic-5',
    name: 'Human Anatomy',
    archived: false,
    createdAt: daysAgo(14),
  },
  {
    id: 'topic-6',
    name: 'Neuroscience Fundamentals',
    archived: false,
    createdAt: daysAgo(10),
  },
  {
    id: 'topic-7',
    name: 'Microbiology',
    archived: false,
    createdAt: daysAgo(7),
  },
  {
    id: 'topic-8',
    name: 'Pharmacology',
    archived: false,
    createdAt: daysAgo(5),
  },
  {
    id: 'topic-9',
    name: 'Immunology',
    archived: false,
    createdAt: daysAgo(3),
  },
]

/* ------------------------------------------------------------------ */
/*  Citations                                                          */
/* ------------------------------------------------------------------ */
export const citations: Citation[] = [
  // asset-doc-1 citations
  {
    id: 'cit-doc1-1',
    label: '[1]',
    snippet:
      'Gene expression is regulated at multiple levels including transcriptional initiation, elongation, and post-transcriptional modification.',
    page: 2,
    sourceAssetId: 'asset-doc-1',
  },
  {
    id: 'cit-doc1-2',
    label: '[2]',
    snippet:
      'Enhancer elements can act over distances of 100 kb or more to stimulate transcription from a promoter.',
    page: 3,
    sourceAssetId: 'asset-doc-1',
  },
  {
    id: 'cit-doc1-3',
    label: '[3]',
    snippet:
      'The lac operon is a classic example of negative regulation in prokaryotic gene expression.',
    page: 5,
    sourceAssetId: 'asset-doc-1',
  },
  {
    id: 'cit-doc1-4',
    label: '[4]',
    snippet:
      'Epigenetic modifications such as DNA methylation and histone acetylation influence chromatin structure and gene accessibility.',
    page: 7,
    sourceAssetId: 'asset-doc-1',
  },
  {
    id: 'cit-doc1-5',
    label: '[5]',
    snippet:
      'Alternative splicing of pre-mRNA allows a single gene to encode multiple protein isoforms.',
    page: 9,
    sourceAssetId: 'asset-doc-1',
  },
  {
    id: 'cit-doc1-6',
    label: '[6]',
    snippet:
      'microRNAs regulate gene expression post-transcriptionally by binding to complementary sequences in target mRNAs.',
    page: 11,
    sourceAssetId: 'asset-doc-1',
  },

  // asset-panopto-1 citations
  {
    id: 'cit-pan1-1',
    label: '[1]',
    snippet:
      'Translation initiation in eukaryotes requires recognition of the 5\u2019 cap and scanning to the AUG start codon.',
    timestampSec: 180,
    sourceAssetId: 'asset-panopto-1',
  },
  {
    id: 'cit-pan1-2',
    label: '[2]',
    snippet:
      'The ribosome is composed of a small 40S subunit that binds mRNA and a large 60S subunit that catalyses peptide bond formation.',
    timestampSec: 720,
    sourceAssetId: 'asset-panopto-1',
  },
  {
    id: 'cit-pan1-3',
    label: '[3]',
    snippet:
      'Chaperone proteins assist in the folding of newly synthesised polypeptides into their functional three-dimensional conformations.',
    timestampSec: 1440,
    sourceAssetId: 'asset-panopto-1',
  },
  {
    id: 'cit-pan1-4',
    label: '[4]',
    snippet:
      'Post-translational modifications including phosphorylation and glycosylation fine-tune protein activity and localisation.',
    timestampSec: 2100,
    sourceAssetId: 'asset-panopto-1',
  },

  // asset-video-1 citations
  {
    id: 'cit-vid1-1',
    label: '[1]',
    snippet:
      'DNA replication begins at origins of replication where the double helix is unwound by helicase enzymes.',
    timestampSec: 120,
    sourceAssetId: 'asset-video-1',
  },
  {
    id: 'cit-vid1-2',
    label: '[2]',
    snippet:
      'DNA polymerase III synthesises the new strand in the 5\u2019 to 3\u2019 direction, using the parental strand as a template.',
    timestampSec: 600,
    sourceAssetId: 'asset-video-1',
  },
  {
    id: 'cit-vid1-3',
    label: '[3]',
    snippet:
      'Okazaki fragments on the lagging strand are joined by DNA ligase after RNA primers are removed.',
    timestampSec: 1200,
    sourceAssetId: 'asset-video-1',
  },

  // synthesis citations
  {
    id: 'cit-syn1-1',
    label: '[1]',
    snippet:
      'Integrating gene expression regulation with protein synthesis pathways reveals coordinated cellular control mechanisms.',
    sourceAssetId: 'asset-doc-1',
  },
  {
    id: 'cit-syn1-2',
    label: '[2]',
    snippet:
      'The central dogma connects transcriptional regulation to translational output, creating layered regulatory control.',
    sourceAssetId: 'asset-panopto-1',
  },
  {
    id: 'cit-syn1-3',
    label: '[3]',
    snippet:
      'Feedback loops between protein products and gene regulatory elements ensure homeostatic gene expression.',
    sourceAssetId: 'asset-doc-1',
  },
]

/* ------------------------------------------------------------------ */
/*  Knowledge Touchpoints                                              */
/* ------------------------------------------------------------------ */

// asset-doc-1 KTs
const ktsDoc1: KnowledgeTouchpoint[] = [
  {
    id: 'kt-doc1-1',
    assetId: 'asset-doc-1',
    index: 0,
    heading: 'Regulatory architecture of gene expression',
    body: 'Gene expression is controlled at multiple levels, from chromatin remodelling through transcriptional initiation to mRNA processing. Enhancer and silencer elements located thousands of base pairs from the promoter modulate transcription rates. This multi-layered regulation allows cells to respond precisely to developmental and environmental cues. At the chromatin level, nucleosome positioning and histone variants determine which regions of the genome are accessible to the transcriptional machinery. Promoter-proximal elements such as the TATA box and initiator sequence recruit general transcription factors and RNA polymerase II to form the pre-initiation complex. Distal regulatory elements, including enhancers and super-enhancers, loop through three-dimensional chromatin interactions mediated by cohesin and CTCF to contact promoters and stimulate transcription. Silencer elements recruit repressor proteins that compact chromatin or interfere with activator binding. The Mediator complex serves as a bridge between transcription factors bound at enhancers and the basal transcriptional machinery at the promoter. Together, these regulatory layers enable exquisite spatial and temporal control of gene expression programs during embryonic development, tissue homeostasis, and adaptive responses to environmental stress.',
    citationIds: ['cit-doc1-1', 'cit-doc1-2'],
    flashcardSetId: 'fset-1',
    quizId: 'quiz-1',
    mindmapId: 'mindmap-1',
  },
  {
    id: 'kt-doc1-2',
    assetId: 'asset-doc-1',
    index: 1,
    heading: 'Negative and positive control of the lac operon',
    body: 'The lac operon provides a paradigm for understanding prokaryotic gene regulation. In the absence of lactose, the repressor protein binds the operator and blocks transcription. When lactose is present, allolactose binds the repressor, causing a conformational change that releases it from the DNA. Cyclic AMP and the catabolite activator protein (CAP) provide an additional layer of positive regulation that couples carbon source availability to gene expression. The operon encodes three structural genes\u2014lacZ (beta-galactosidase), lacY (permease), and lacA (transacetylase)\u2014that are transcribed as a single polycistronic mRNA. Beta-galactosidase cleaves lactose into glucose and galactose, while permease transports lactose into the cell. When glucose is abundant, cAMP levels are low and CAP cannot bind the promoter, so transcription remains minimal even if lactose is present; this phenomenon is known as catabolite repression. The lac operon therefore illustrates how bacteria integrate multiple environmental signals\u2014the presence of lactose and the absence of glucose\u2014to make economical decisions about gene expression. Jacob and Monod\\\'s elucidation of this system in the 1960s earned them the Nobel Prize and established foundational concepts in molecular biology, including the operon model, the role of regulatory genes, and the distinction between structural and regulatory elements.',
    citationIds: ['cit-doc1-3'],
    flashcardSetId: 'fset-1',
    quizId: 'quiz-1',
    mindmapId: 'mindmap-1',
  },
  {
    id: 'kt-doc1-3',
    assetId: 'asset-doc-1',
    index: 2,
    heading: 'Epigenetic modifications and chromatin remodelling',
    body: 'Epigenetic marks such as DNA methylation at CpG islands and covalent histone modifications regulate chromatin accessibility without altering the DNA sequence. Histone acetylation generally opens chromatin, promoting transcription, while methylation can either activate or silence genes depending on the residue modified. These marks are heritable through cell division and play critical roles in development and disease. DNA methyltransferases (DNMTs) catalyse the addition of methyl groups to cytosine residues, and DNMT1 preferentially methylates hemi-methylated DNA during replication to maintain epigenetic patterns across generations. Histone modifications constitute a complex regulatory code: for example, trimethylation of histone H3 at lysine 4 (H3K4me3) is associated with active promoters, whereas trimethylation at lysine 27 (H3K27me3) marks repressed chromatin maintained by the Polycomb repressive complex. Bivalent domains carrying both activating and repressive marks are characteristic of poised genes in embryonic stem cells, allowing rapid activation or silencing upon differentiation signals. Chromatin remodelling complexes such as SWI/SNF use ATP hydrolysis to slide, eject, or restructure nucleosomes, thereby exposing or concealing regulatory DNA elements. Aberrant epigenetic patterns are implicated in numerous diseases, including cancer, where global hypomethylation can activate oncogenes while hypermethylation of tumour suppressor promoters silences their protective functions. Therapeutic strategies targeting epigenetic regulators, such as HDAC inhibitors and DNMT inhibitors, are now in clinical use for certain haematological malignancies.',
    citationIds: ['cit-doc1-4'],
    flashcardSetId: 'fset-1',
    quizId: 'quiz-1',
    mindmapId: 'mindmap-1',
  },
  {
    id: 'kt-doc1-4',
    assetId: 'asset-doc-1',
    index: 3,
    heading: 'Post-transcriptional regulation and alternative splicing',
    body: 'Alternative splicing allows a single gene to produce multiple protein variants by including or excluding specific exons. This process is regulated by splicing factors that recognise cis-acting elements in the pre-mRNA. Additionally, microRNAs provide a post-transcriptional layer of regulation by guiding the RNA-induced silencing complex to complementary target sequences, leading to mRNA degradation or translational repression. The spliceosome, a large ribonucleoprotein complex composed of five small nuclear RNAs (snRNAs) and over 150 associated proteins, carries out intron removal through two sequential transesterification reactions. Exonic and intronic splicing enhancers and silencers serve as binding platforms for SR proteins and heterogeneous nuclear ribonucleoproteins (hnRNPs), which promote or inhibit splice site recognition respectively. It is estimated that over 95% of human multi-exon genes undergo alternative splicing, vastly expanding the proteomic diversity encoded by roughly 20,000 protein-coding genes. In the nervous system, for example, alternative splicing of the Dscam gene in Drosophila can generate over 38,000 distinct mRNA isoforms that contribute to neuronal wiring specificity. MicroRNAs, typically 21\u201323 nucleotides in length, are processed from longer precursor transcripts by the enzymes Drosha and Dicer before being loaded into the Argonaute protein within the RISC complex. A single microRNA can regulate hundreds of target mRNAs, and conversely, a single mRNA can be regulated by multiple microRNAs, creating complex regulatory networks that fine-tune protein expression levels in virtually every biological process.',
    citationIds: ['cit-doc1-5', 'cit-doc1-6'],
    flashcardSetId: 'fset-1',
    quizId: 'quiz-1',
    mindmapId: 'mindmap-1',
  },
]

// asset-panopto-1 KTs
const ktsPan1: KnowledgeTouchpoint[] = [
  {
    id: 'kt-pan1-1',
    assetId: 'asset-panopto-1',
    index: 0,
    heading: 'Translation initiation and the scanning mechanism',
    body: 'Eukaryotic translation begins when the 43S pre-initiation complex binds the 5\u2019 cap of the mRNA and scans downstream until it encounters the first AUG codon in a favourable Kozak context. Initiation factors eIF4E, eIF4G, and eIF4A facilitate cap recognition and mRNA unwinding. The process is a major regulatory checkpoint for protein synthesis. The 43S complex is formed by the 40S ribosomal subunit associating with the ternary complex of eIF2, GTP, and the initiator methionyl-tRNA. The eIF4F cap-binding complex, consisting of eIF4E (cap-binding protein), eIF4A (RNA helicase), and eIF4G (scaffold protein), recruits the 43S complex to the mRNA 5\u2019 end. As the complex scans through the 5\u2019 untranslated region, eIF4A unwinds secondary structures that could impede ribosome movement. Recognition of the start codon triggers GTP hydrolysis by eIF2, leading to release of initiation factors and joining of the 60S subunit to form the functional 80S ribosome. Phosphorylation of eIF2-alpha by stress-responsive kinases such as GCN2, PERK, HRI, and PKR globally represses translation while selectively upregulating stress-response mRNAs containing upstream open reading frames. The mTOR signalling pathway also regulates translation initiation by controlling the phosphorylation of 4E-BP, which sequesters eIF4E and prevents cap-dependent translation under nutrient-poor conditions.',
    citationIds: ['cit-pan1-1'],
    flashcardSetId: 'fset-2',
    quizId: 'quiz-2',
  },
  {
    id: 'kt-pan1-2',
    assetId: 'asset-panopto-1',
    index: 1,
    heading: 'Ribosome structure and peptide bond formation',
    body: 'The eukaryotic ribosome is an 80S complex composed of a 40S small subunit and a 60S large subunit. The small subunit decodes mRNA by matching codons to aminoacyl-tRNAs, while the large subunit contains the peptidyl transferase centre that catalyses peptide bond formation. Structural studies have revealed that the catalytic activity is performed by ribosomal RNA, making the ribosome a ribozyme. The 40S subunit contains 18S rRNA and approximately 33 ribosomal proteins, while the 60S subunit contains 28S, 5.8S, and 5S rRNAs along with roughly 47 proteins. During the elongation cycle, aminoacyl-tRNAs are delivered to the ribosomal A site by elongation factor eEF1A in a GTP-dependent manner. Correct codon-anticodon base pairing triggers GTP hydrolysis and accommodation of the tRNA into the A site, after which the peptidyl transferase centre catalyses transfer of the growing polypeptide chain to the incoming amino acid. Translocation of the ribosome along the mRNA by one codon is driven by eEF2 and GTP hydrolysis, moving the deacylated tRNA to the E site for ejection. The discovery that peptide bond formation is catalysed by the 23S rRNA (in prokaryotes) rather than by protein components provided compelling evidence for the RNA world hypothesis, suggesting that RNA preceded proteins as biological catalysts. Antibiotics such as chloramphenicol and erythromycin target the bacterial peptidyl transferase centre, exploiting structural differences between prokaryotic and eukaryotic ribosomes to achieve selective toxicity.',
    citationIds: ['cit-pan1-2'],
    flashcardSetId: 'fset-2',
    quizId: 'quiz-2',
  },
  {
    id: 'kt-pan1-3',
    assetId: 'asset-panopto-1',
    index: 2,
    heading: 'Protein folding and post-translational modifications',
    body: 'Newly synthesised polypeptides must fold into precise three-dimensional structures to become functional proteins. Molecular chaperones such as Hsp70 and chaperonins prevent misfolding and aggregation. After folding, proteins undergo post-translational modifications including phosphorylation, glycosylation, and ubiquitination that regulate their activity, localisation, and half-life. The Hsp70 chaperone system recognises exposed hydrophobic segments on nascent polypeptides and uses ATP-driven conformational changes to prevent premature folding and aggregation. For proteins that require additional assistance, the chaperonin GroEL/GroES (in prokaryotes) or TRiC/CCT (in eukaryotes) provides an enclosed chamber where folding can proceed in isolation from the crowded cytoplasm. Misfolded proteins that escape chaperone surveillance are targeted for degradation by the ubiquitin-proteasome system, in which polyubiquitin chains serve as molecular tags recognised by the 26S proteasome. Phosphorylation, catalysed by protein kinases and reversed by phosphatases, is the most widespread post-translational modification and plays central roles in signal transduction cascades such as the MAP kinase pathway. N-linked and O-linked glycosylation are essential for proper folding and trafficking of secretory and membrane proteins through the endoplasmic reticulum and Golgi apparatus. Protein misfolding diseases, including Alzheimer\\\'s disease, Parkinson\\\'s disease, and cystic fibrosis, underscore the biological importance of quality control mechanisms and have motivated the development of pharmacological chaperones and proteostasis regulators as therapeutic strategies.',
    citationIds: ['cit-pan1-3', 'cit-pan1-4'],
    flashcardSetId: 'fset-2',
    quizId: 'quiz-2',
  },
]

// asset-video-1 KTs
const ktsVid1: KnowledgeTouchpoint[] = [
  {
    id: 'kt-vid1-1',
    assetId: 'asset-video-1',
    index: 0,
    heading: 'Origins of replication and helicase unwinding',
    body: 'DNA replication is initiated at specific genomic loci called origins of replication. The enzyme helicase unwinds the double helix, creating a replication fork. Single-strand binding proteins stabilise the separated strands, while topoisomerase relieves the torsional strain generated ahead of the fork. In eukaryotes, replication origins are licensed during the G1 phase of the cell cycle by the loading of the MCM2-7 helicase complex through the action of the origin recognition complex (ORC), Cdc6, and Cdt1. Activation of S-phase cyclin-dependent kinases and Dbf4-dependent kinase triggers origin firing, converting the pre-replicative complex into an active replication fork. Each human cell contains tens of thousands of replication origins that fire in a coordinated temporal programme, with euchromatic regions generally replicating early and heterochromatin replicating late. The hexameric MCM helicase encircles the leading strand template and translocates in the 3\u2019 to 5\u2019 direction, unwinding duplex DNA at rates of approximately 1 kilobase per minute. Replication protein A (RPA) coats the exposed single-stranded DNA to prevent reannealing and protect it from nuclease degradation. Topoisomerases I and II relieve positive supercoiling ahead of the fork by introducing transient single- or double-strand breaks, and their inhibition leads to replication fork stalling and activation of the DNA damage checkpoint.',
    citationIds: ['cit-vid1-1'],
  },
  {
    id: 'kt-vid1-2',
    assetId: 'asset-video-1',
    index: 1,
    heading: 'Leading and lagging strand synthesis',
    body: 'DNA polymerase synthesises new DNA exclusively in the 5\u2019 to 3\u2019 direction. The leading strand is synthesised continuously, while the lagging strand is produced as short Okazaki fragments. Each fragment requires an RNA primer synthesised by primase before DNA polymerase can extend it. On the leading strand, DNA polymerase epsilon maintains a continuous association with the template and extends the daughter strand processively with the assistance of the sliding clamp PCNA (proliferating cell nuclear antigen), which is loaded onto DNA by the clamp loader replication factor C (RFC). On the lagging strand, DNA polymerase delta synthesises each Okazaki fragment\u2014typically 100 to 200 nucleotides in eukaryotes\u2014before dissociating and recycling to the next RNA primer. The primase component of the DNA polymerase alpha-primase complex synthesises a short RNA primer of approximately 8 to 12 nucleotides, which is then extended by a short stretch of DNA before handoff to polymerase delta. The asymmetry between leading and lagging strand synthesis creates a trombone model in which the lagging strand template loops back so that both polymerases can move in the same direction as the replication fork. Coordination between helicase and polymerase activities is essential to prevent the accumulation of excessive single-stranded DNA, which can trigger the ATR-dependent replication stress checkpoint. The inherent complexity of lagging strand synthesis makes it more susceptible to replication errors and has implications for the distribution of mutations across the genome.',
    citationIds: ['cit-vid1-2'],
  },
  {
    id: 'kt-vid1-3',
    assetId: 'asset-video-1',
    index: 2,
    heading: 'Fragment processing and replication fidelity',
    body: 'After Okazaki fragment synthesis, RNase H removes the RNA primers and DNA polymerase I fills the resulting gaps. DNA ligase seals the nicks to produce a continuous daughter strand. Proofreading by the 3\u2019-to-5\u2019 exonuclease activity of DNA polymerase, combined with mismatch repair mechanisms, ensures replication fidelity of approximately one error per billion base pairs. In eukaryotes, the flap endonuclease FEN1 works in concert with RNase H to remove RNA primers and any displaced DNA flaps created during gap-filling synthesis. DNA ligase I then joins the adjacent Okazaki fragments by catalysing the formation of a phosphodiester bond in an ATP-dependent reaction. The 3\u2019-to-5\u2019 exonuclease proofreading activity of replicative polymerases detects and excises misincorporated nucleotides immediately after synthesis, reducing the error rate from approximately one in 100,000 to one in 10 million. The mismatch repair (MMR) system, involving MutS-alpha and MutL-alpha complexes in eukaryotes, scans newly replicated DNA for mismatches and small insertion-deletion loops, improving fidelity by an additional two orders of magnitude. Defects in MMR genes such as MSH2 and MLH1 cause Lynch syndrome, a hereditary predisposition to colorectal and other cancers characterised by microsatellite instability. At chromosome ends, the end-replication problem leads to progressive telomere shortening with each cell division, which is counteracted in stem cells and cancer cells by the ribonucleoprotein enzyme telomerase that extends the 3\u2019 G-rich overhang using its internal RNA template.',
    citationIds: ['cit-vid1-3'],
  },
]

// synthesis asset KTs (asset-synthesis-1)
const ktsSyn1: KnowledgeTouchpoint[] = [
  {
    id: 'kt-syn1-1',
    assetId: 'asset-synthesis-1',
    index: 0,
    heading: 'Integrated view of the central dogma',
    body: 'Combining insights from gene expression notes and protein synthesis lectures reveals the tightly coordinated flow of genetic information from DNA to RNA to protein. Regulatory mechanisms at each step ensure that cells produce the right proteins at the right time and in the right amounts. The central dogma, first articulated by Francis Crick in 1958, describes this unidirectional information flow, although exceptions such as reverse transcription by retroviruses and RNA-dependent RNA replication demonstrate that biological systems can deviate from this framework. Transcriptional regulation determines which genes are expressed in a given cell type, but the ultimate protein output also depends on mRNA stability, translational efficiency, and protein degradation rates. For instance, mRNAs encoding cytokines and growth factors often contain AU-rich elements in their 3\u2019 untranslated regions that target them for rapid decay, allowing swift downregulation of inflammatory responses. The coupling of transcription and translation in prokaryotes, where ribosomes begin translating mRNA before transcription is complete, allows for rapid responses to environmental changes such as nutrient shifts. In eukaryotes, the physical separation of transcription in the nucleus and translation in the cytoplasm introduces additional regulatory opportunities, including nuclear export control and cytoplasmic mRNA localisation. Systems biology approaches using transcriptomics, proteomics, and ribosome profiling have revealed that mRNA abundance accounts for only about 40% of the variance in protein levels, underscoring the importance of post-transcriptional regulation in shaping the proteome.',
    citationIds: ['cit-syn1-1', 'cit-syn1-2'],
    flashcardSetId: 'fset-3',
  },
  {
    id: 'kt-syn1-2',
    assetId: 'asset-synthesis-1',
    index: 1,
    heading: 'Transcription-translation coupling in regulation',
    body: 'Transcriptional regulation establishes the initial pool of mRNA transcripts, while translational control fine-tunes protein output. For instance, upstream open reading frames and internal ribosome entry sites provide additional regulatory flexibility beyond promoter-level control. Together, these mechanisms create a robust and adaptable gene expression programme. Upstream open reading frames (uORFs) are short coding sequences in the 5\u2019 UTR that can attenuate translation of the main downstream ORF by causing ribosomes to dissociate or stall before reaching the primary start codon. The transcription factor ATF4, a key mediator of the integrated stress response, is paradoxically upregulated during cellular stress through a uORF-dependent mechanism in which phosphorylation of eIF2-alpha allows ribosomes to bypass inhibitory uORFs and initiate at the ATF4 coding sequence. Internal ribosome entry sites (IRESes) enable cap-independent translation initiation and are particularly important during conditions such as mitosis, apoptosis, and viral infection when cap-dependent translation is suppressed. Many viral mRNAs, including those of hepatitis C virus and poliovirus, contain IRES elements that hijack the host translational machinery. RNA-binding proteins such as HuR and TTP regulate mRNA stability by binding to specific sequence elements, while cytoplasmic polyadenylation can reactivate dormant maternal mRNAs during early embryonic development. The interplay between transcriptional and translational regulation creates a multi-tiered control system that enables cells to mount rapid, graded, and reversible responses to changing physiological demands.',
    citationIds: ['cit-syn1-2'],
    flashcardSetId: 'fset-3',
  },
  {
    id: 'kt-syn1-3',
    assetId: 'asset-synthesis-1',
    index: 2,
    heading: 'Feedback loops in gene regulatory networks',
    body: 'Protein products frequently feed back to regulate their own expression through autoregulatory loops. Negative feedback dampens expression to maintain homeostasis, while positive feedback can generate switch-like responses. These feedback architectures are fundamental to processes such as cellular differentiation and the cell cycle. A classic example of negative autoregulation is the tumour suppressor p53, which activates transcription of MDM2, an E3 ubiquitin ligase that targets p53 for proteasomal degradation, thereby creating an oscillatory circuit that pulses in response to DNA damage. Positive feedback loops are exemplified by the mutual activation between transcription factors such as MyoD in muscle differentiation, where MyoD activates its own transcription to lock cells into a committed myogenic fate. Bistable switches, generated by combining positive feedback with ultrasensitive responses, underlie irreversible cell fate decisions such as the restriction point in the G1 phase of the cell cycle, beyond which cells are committed to DNA replication regardless of mitogenic signals. Feed-forward loops, in which a transcription factor regulates a target gene both directly and indirectly through an intermediate regulator, can filter out transient signals and respond only to persistent stimuli. Synthetic biology has leveraged these natural circuit motifs to engineer artificial gene networks, including toggle switches and oscillators, in both prokaryotic and eukaryotic cells. Understanding the quantitative behaviour of these regulatory networks requires mathematical modelling approaches, including ordinary differential equations and stochastic simulations, which have become essential tools in modern systems biology.',
    citationIds: ['cit-syn1-3'],
    flashcardSetId: 'fset-3',
  },
]

/* ------------------------------------------------------------------ */
/*  Learning Assets                                                    */
/* ------------------------------------------------------------------ */
export const learningAssets: LearningAsset[] = [
  {
    id: 'asset-doc-1',
    title: 'Gene Expression Notes',
    type: 'document',
    topicId: 'topic-1',
    studySetId: null,
    addedAt: daysAgo(55),
    lastOpenedAt: daysAgo(1),
    processingStatus: 'ready',
    sourceLabel: 'Uploaded PDF',
    originalUrl: '/mock/gene-expression-notes.pdf',
    pages: 12,
    knowledgeTouchpoints: ktsDoc1,
    citations: citations.filter((c) => c.sourceAssetId === 'asset-doc-1'),
  },
  {
    id: 'asset-panopto-1',
    title: 'Protein Synthesis Lecture',
    type: 'panopto',
    topicId: 'topic-1',
    studySetId: null,
    addedAt: daysAgo(50),
    lastOpenedAt: daysAgo(2),
    processingStatus: 'ready',
    sourceLabel: 'Panopto',
    originalUrl: 'https://panopto.example.com/Panopto/Pages/Viewer.aspx?id=mock-ps-lecture',
    durationMinutes: 48,
    knowledgeTouchpoints: ktsPan1,
    citations: citations.filter((c) => c.sourceAssetId === 'asset-panopto-1'),
  },
  {
    id: 'asset-video-1',
    title: 'DNA Replication Overview',
    type: 'video',
    topicId: 'topic-2',
    studySetId: null,
    addedAt: daysAgo(35),
    lastOpenedAt: daysAgo(3),
    processingStatus: 'ready',
    sourceLabel: 'Uploaded Video',
    originalUrl: '/mock/dna-replication.mp4',
    durationMinutes: 32,
    knowledgeTouchpoints: ktsVid1,
    citations: citations.filter((c) => c.sourceAssetId === 'asset-video-1'),
  },
  {
    id: 'asset-doc-2',
    title: 'RNA Sequencing Methods',
    type: 'document',
    topicId: 'topic-1',
    studySetId: null,
    addedAt: daysAgo(10),
    lastOpenedAt: daysAgo(10),
    processingStatus: 'failed',
    sourceLabel: 'Uploaded PDF',
    originalUrl: '/mock/rna-sequencing-methods.pdf',
    pages: 8,
    knowledgeTouchpoints: [],
    citations: [],
  },
  {
    id: 'asset-processing-1',
    title: 'Enzyme Kinetics Lab',
    type: 'document',
    topicId: 'topic-2',
    studySetId: null,
    addedAt: daysAgo(1),
    lastOpenedAt: daysAgo(1),
    processingStatus: 'processing',
    sourceLabel: 'Uploaded PDF',
    originalUrl: '/mock/enzyme-kinetics-lab.pdf',
    pages: 6,
    knowledgeTouchpoints: [],
    citations: [],
  },
  {
    id: 'asset-synthesis-1',
    title: 'Week 3 Study Set Synthesis',
    type: 'document',
    topicId: 'topic-1',
    studySetId: 'studyset-1',
    addedAt: daysAgo(14),
    lastOpenedAt: daysAgo(2),
    processingStatus: 'ready',
    sourceLabel: 'AI Synthesis',
    originalUrl: '',
    isSynthesis: true,
    sourceAssetIds: ['asset-doc-1', 'asset-panopto-1'],
    knowledgeTouchpoints: ktsSyn1,
    citations: citations.filter(
      (c) =>
        c.id === 'cit-syn1-1' ||
        c.id === 'cit-syn1-2' ||
        c.id === 'cit-syn1-3'
    ),
  },
]

/* ------------------------------------------------------------------ */
/*  Study Sets                                                         */
/* ------------------------------------------------------------------ */
export const studySets: StudySet[] = [
  {
    id: 'studyset-1',
    topicId: 'topic-1',
    name: 'Week 3 Materials',
    assetIds: ['asset-doc-1', 'asset-panopto-1'],
    createdAt: daysAgo(14),
    synthesisAssetId: 'asset-synthesis-1',
  },
]
