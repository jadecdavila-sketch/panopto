import type { PanoptoVideo } from '../types/domain'

const daysAgo = (d: number): string =>
  new Date(Date.now() - d * 86_400_000).toISOString()

export const panoptoCatalog: PanoptoVideo[] = [
  {
    id: 'pv-1',
    title: 'Introduction to Molecular Biology',
    duration: '52:14',
    recordedDate: daysAgo(90),
    thumbnailUrl: '/mock/thumbnails/molecular-bio.png',
  },
  {
    id: 'pv-2',
    title: 'Protein Synthesis Lecture',
    duration: '48:23',
    recordedDate: daysAgo(60),
    thumbnailUrl: '/mock/thumbnails/protein-synthesis.png',
  },
  {
    id: 'pv-3',
    title: 'Organic Chemistry: Functional Groups',
    duration: '41:07',
    recordedDate: daysAgo(55),
    thumbnailUrl: '/mock/thumbnails/functional-groups.png',
  },
  {
    id: 'pv-4',
    title: 'Cell Membrane Structure and Function',
    duration: '37:45',
    recordedDate: daysAgo(45),
    thumbnailUrl: '/mock/thumbnails/cell-membrane.png',
  },
  {
    id: 'pv-5',
    title: 'Enzyme Kinetics and Catalysis',
    duration: '44:30',
    recordedDate: daysAgo(40),
    thumbnailUrl: '/mock/thumbnails/enzyme-kinetics.png',
  },
  {
    id: 'pv-6',
    title: 'DNA Replication and Repair Mechanisms',
    duration: '55:12',
    recordedDate: daysAgo(35),
    thumbnailUrl: '/mock/thumbnails/dna-repair.png',
  },
  {
    id: 'pv-7',
    title: 'Mitosis and Meiosis Compared',
    duration: '38:50',
    recordedDate: daysAgo(30),
    thumbnailUrl: '/mock/thumbnails/mitosis-meiosis.png',
  },
  {
    id: 'pv-8',
    title: 'Signal Transduction Pathways',
    duration: '46:18',
    recordedDate: daysAgo(25),
    thumbnailUrl: '/mock/thumbnails/signal-transduction.png',
  },
  {
    id: 'pv-9',
    title: 'Photosynthesis: Light and Dark Reactions',
    duration: '42:55',
    recordedDate: daysAgo(20),
    thumbnailUrl: '/mock/thumbnails/photosynthesis.png',
  },
  {
    id: 'pv-10',
    title: 'Genetics of Inheritance Patterns',
    duration: '50:03',
    recordedDate: daysAgo(15),
    thumbnailUrl: '/mock/thumbnails/inheritance.png',
  },
]
