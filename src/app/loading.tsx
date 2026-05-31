import { Spinner } from "@/ui/spinner";

export default function Loading() {
  return (
    <div className="grid min-h-svh place-items-center bg-background">
      <Spinner className="size-8 text-brand" />
    </div>
  );
}
