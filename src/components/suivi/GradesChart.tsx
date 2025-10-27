import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from "recharts";

interface GradesChartProps {
  gradesBySubject: Record<string, any[]>;
}

export const GradesChart = ({ gradesBySubject }: GradesChartProps) => {
  // Préparer les données pour le graphique en barres
  const barData = Object.entries(gradesBySubject).map(([subject, grades]) => {
    const totalWeighted = grades.reduce((sum, g) => sum + g.score * g.coefficient, 0);
    const totalCoeff = grades.reduce((sum, g) => sum + g.coefficient, 0);
    const average = totalCoeff > 0 ? (totalWeighted / totalCoeff).toFixed(2) : '0';

    return {
      subject: subject.length > 15 ? subject.substring(0, 15) + '...' : subject,
      moyenne: parseFloat(average),
    };
  });

  // Préparer les données pour le graphique radar
  const radarData = barData.map(item => ({
    subject: item.subject,
    note: item.moyenne,
  }));

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Moyennes par matière</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="subject" angle={-45} textAnchor="end" height={100} />
              <YAxis domain={[0, 20]} />
              <Tooltip />
              <Bar dataKey="moyenne" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profil de compétences</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <PolarRadiusAxis angle={90} domain={[0, 20]} />
              <Radar name="Notes" dataKey="note" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};