import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-8 w-32" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-none shadow-sm h-full">
           <CardHeader><Skeleton className="h-6 w-32" /><Skeleton className="h-4 w-48" /></CardHeader>
           <CardContent><Skeleton className="h-[300px] w-full" /></CardContent>
        </Card>
        <Card className="lg:col-span-3 border-none shadow-sm h-full">
           <CardHeader><Skeleton className="h-6 w-32" /><Skeleton className="h-4 w-48" /></CardHeader>
           <CardContent className="space-y-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                   <Skeleton className="h-10 w-10 rounded-full" />
                   <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-24" />
                   </div>
                </div>
              ))}
           </CardContent>
        </Card>
      </div>
    </div>
  );
}
