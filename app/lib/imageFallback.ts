interface PlayerImageInput {
  id: number;
  name: string;
  image_url?: string | null;
  current_team_image?: string | null;
}

interface TeamImageInput {
  id: number;
  name: string;
  acronym?: string | null;
  image_url?: string | null;
}

export function getPlayerFallbackUrl(id: number, name: string) {
  const params = new URLSearchParams();
  if (name) {
    params.set("name", name);
  }
  const query = params.toString();
  return `/api/esports/player/${id}/image${query ? `?${query}` : ""}`;
}

export function getTeamFallbackUrl(team: TeamImageInput) {
  const params = new URLSearchParams();
  if (team.name) {
    params.set("name", team.name);
  }
  if (team.acronym) {
    params.set("acronym", team.acronym);
  }
  const query = params.toString();
  return `/api/esports/team/${team.id}/logo${query ? `?${query}` : ""}`;
}

export function getPlayerImageUrl(player: PlayerImageInput) {
  if (player.image_url) return player.image_url;
  if (player.current_team_image) return player.current_team_image;
  return getPlayerFallbackUrl(player.id, player.name);
}

export function getTeamImageUrl(team: TeamImageInput) {
  if (team.image_url) return team.image_url;
  return getTeamFallbackUrl(team);
}
