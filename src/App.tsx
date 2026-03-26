import { lazy, Suspense } from "react";
import { createHashRouter, RouterProvider } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import { Skeleton } from "./components/ui/Skeleton";

const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const TopicPage = lazy(() => import("./pages/TopicPage"));
const StudySetPage = lazy(() => import("./pages/StudySetPage"));
const AssetPage = lazy(() => import("./pages/AssetPage"));
const FlashcardSessionPage = lazy(
  () => import("./pages/FlashcardSessionPage")
);
const QuizSessionPage = lazy(() => import("./pages/QuizSessionPage"));
const MindMapPage = lazy(() => import("./pages/MindMapPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

function PageFallback() {
  return (
    <div className="mx-auto max-w-5xl space-y-4 p-6">
      <Skeleton variant="text" width="40%" height={24} />
      <Skeleton variant="rect" width="100%" height={200} />
      <Skeleton variant="rect" width="100%" height={120} />
    </div>
  );
}

function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageFallback />}>{children}</Suspense>;
}

const router = createHashRouter([
  {
    element: <AppLayout />,
    children: [
      {
        path: "/",
        element: (
          <Lazy>
            <DashboardPage />
          </Lazy>
        ),
      },
      {
        path: "/topics/:topicId",
        element: (
          <Lazy>
            <TopicPage />
          </Lazy>
        ),
      },
      {
        path: "/topics/:topicId/study-sets/:setId",
        element: (
          <Lazy>
            <StudySetPage />
          </Lazy>
        ),
      },
      {
        path: "/assets/:assetId",
        element: (
          <Lazy>
            <AssetPage />
          </Lazy>
        ),
      },
    ],
  },
  /* Full-screen routes (no AppLayout) */
  {
    path: "/study/flashcards",
    element: (
      <Lazy>
        <FlashcardSessionPage />
      </Lazy>
    ),
  },
  {
    path: "/study/quiz",
    element: (
      <Lazy>
        <QuizSessionPage />
      </Lazy>
    ),
  },
  {
    path: "/mindmap/:mindmapId",
    element: (
      <Lazy>
        <MindMapPage />
      </Lazy>
    ),
  },
  {
    path: "*",
    element: (
      <Lazy>
        <NotFoundPage />
      </Lazy>
    ),
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
