import { createBrowserRouter, RouterProvider } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import TopicPage from "./pages/TopicPage";
import StudySetPage from "./pages/StudySetPage";
import AssetPage from "./pages/AssetPage";
import FlashcardSessionPage from "./pages/FlashcardSessionPage";
import QuizSessionPage from "./pages/QuizSessionPage";
import MindMapPage from "./pages/MindMapPage";
import NotFoundPage from "./pages/NotFoundPage";

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: "/", element: <DashboardPage /> },
      { path: "/topics/:topicId", element: <TopicPage /> },
      {
        path: "/topics/:topicId/study-sets/:setId",
        element: <StudySetPage />,
      },
      { path: "/assets/:assetId", element: <AssetPage /> },
    ],
  },
  /* Full-screen routes (no AppLayout) */
  { path: "/flashcards/:setId/session", element: <FlashcardSessionPage /> },
  { path: "/quiz/:quizId/session", element: <QuizSessionPage /> },
  { path: "/mindmap/:mindmapId", element: <MindMapPage /> },
  { path: "*", element: <NotFoundPage /> },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
