import { redirect } from "next/navigation";

interface PageProps {
  params: {
    id: string;
  };
}

export default function JugadorRedirect({ params }: PageProps) {
  redirect(`/esports/player/${params.id}`);
}
