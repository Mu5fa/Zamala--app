import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 p-4 font-tajawal">
      <Card className="w-full max-w-md text-center py-10 rounded-3xl shadow-xl border-0">
        <CardContent>
          <div className="flex mb-6 justify-center">
            <div className="bg-red-100 p-6 rounded-full">
              <AlertCircle className="h-16 w-16 text-red-500" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">404 - الصفحة غير موجودة</h1>
          <p className="text-gray-500 mb-8 text-lg">
            عذراً، يبدو أنك ضللت الطريق في عالم الرياضيات!
          </p>

          <Link href="/">
            <Button size="lg" className="w-full rounded-xl font-bold text-lg h-12">
              العودة للرئيسية
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
