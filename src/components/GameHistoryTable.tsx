import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHead, TableBody, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { Swords } from "lucide-react";

export default function GameHistoryTable({moves}: {moves: string[]}) {
    return (
        <Card className="flex-1">
            <CardHeader className="py-3 px-4 border-b">
                <CardTitle className="font-semibold flex items-center gap-2">
                    <Swords className="w-4 h-4" /> Match Timeline
                </CardTitle>
            </CardHeader>
            <CardContent
                className="p-0 flex-1 overflow-y-auto overflow-x-hidden"
                style={{ scrollbarWidth: "thin" }}>
                <Table className="mx-auto text-center">
                    <TableHeader >
                        <TableRow>
                            <TableHead></TableHead>
                            <TableHead className="text-center">White Move</TableHead>
                            <TableHead className="text-center">Black Move</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {moves.reduce((acc : string[][] , _, i) => {
                            if (i % 2 === 0) acc.push(moves.slice(i, i + 2));
                            return acc;
                        }, []).map((movePair, index) => (
                            <TableRow key={index}>
                                <TableCell>{index + 1}.</TableCell>
                                <TableCell><Badge>{movePair[0]}</Badge> </TableCell>
                                {movePair[1] && (
                                    <TableCell><Badge variant="secondary">{movePair[1]}</Badge> </TableCell>
                                )}
                            </TableRow>
                        ))  }
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
