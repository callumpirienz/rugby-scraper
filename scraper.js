const competitions = Array.from(new Set(standings.map(s => s.competition)));

return (
  <div className="space-y-12">
    {competitions.map((competition) => (
      <div key={competition}>
        <h2 className="text-xl font-bold text-gray-800 mb-3 uppercase tracking-wide">
          {competition.replace('-', ' ')}
        </h2>
        <div className="overflow-x-auto border rounded-lg shadow-sm">
          <table className="min-w-full text-sm text-left border-collapse">
            <thead className="bg-gray-100 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Team</th>
                <th className="px-4 py-3">Played</th>
                <th className="px-4 py-3">Won</th>
                <th className="px-4 py-3">Drawn</th>
                <th className="px-4 py-3">Lost</th>
                <th className="px-4 py-3">Points</th>
              </tr>
            </thead>
            <tbody>
              {standings
                .filter(s => s.competition === competition)
                .map((team) => (
                  <tr key={team.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium">{team.team}</td>
                    <td className="px-4 py-2">{team.played}</td>
                    <td className="px-4 py-2">{team.won}</td>
                    <td className="px-4 py-2">{team.drawn}</td>
                    <td className="px-4 py-2">{team.lost}</td>
                    <td className="px-4 py-2 font-semibold">{team.points}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    ))}
  </div>
);
