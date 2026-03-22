export function createMindApi(client) {
  return {
    getStats() {
      return client.get("stats");
    },
    getSurface() {
      return client.get("surface");
    },
    getOrient() {
      return client.get("orient");
    },
    getGround() {
      return client.get("ground");
    },
    getInnerWeather() {
      return client.get("inner-weather");
    },
    getHeat() {
      return client.get("heat");
    },
    getRecent() {
      return client.get("recent");
    },
    getPatterns() {
      return client.get("patterns");
    },
    getHealthScores() {
      return client.get("health-scores");
    },
    runDaemon() {
      return client.post("process", {});
    },
    listEntities(query = "") {
      return client.get(`entities${query}`);
    },
    getEntity(id) {
      return client.get(`entities/${id}`);
    },
    createEntity(body) {
      return client.post("entities", body);
    },
    updateEntity(id, body) {
      return client.request(`entities/${id}`, { method: "PUT", body });
    },
    mergeEntity(body) {
      return client.post("entities/merge", body);
    },
    deleteEntity(id) {
      return client.request(`entities/${id}`, { method: "DELETE" });
    },
    listObservations(query = "") {
      return client.get(`observations${query}`);
    },
    getObservation(id) {
      return client.get(`observations/${id}`);
    },
    createObservation(body) {
      return client.post("observations", body);
    },
    updateObservation(id, body) {
      return client.request(`observations/${id}`, { method: "PUT", body });
    },
    deleteObservation(id) {
      return client.request(`observations/${id}`, { method: "DELETE" });
    },
    sitObservation(id, body) {
      return client.post(`observations/${id}/sit`, body);
    },
    resolveObservation(id, body) {
      return client.post(`observations/${id}/resolve`, body);
    },
    bulkObservations(body) {
      return client.post("observations/bulk", body);
    },
    listRelations(query = "") {
      return client.get(`relations${query}`);
    },
    createRelation(body) {
      return client.post("relations", body);
    },
    updateRelation(id, body) {
      return client.request(`relations/${id}`, { method: "PUT", body });
    },
    deleteRelation(id) {
      return client.request(`relations/${id}`, { method: "DELETE" });
    },
    listImages(query = "") {
      return client.get(`images${query}`);
    },
    listIdentity() {
      return client.get("identity");
    },
    getIdentitySection(section) {
      return client.get(`identity/${encodeURIComponent(section)}`);
    },
    createIdentity(body) {
      return client.post("identity", body);
    },
    updateIdentity(section, body) {
      return client.request(`identity/${encodeURIComponent(section)}`, {
        method: "PUT",
        body
      });
    },
    deleteIdentity(section) {
      return client.request(`identity/${encodeURIComponent(section)}`, {
        method: "DELETE"
      });
    },
    listProposals(status = "pending") {
      return client.get(`proposals?status=${encodeURIComponent(status)}`);
    },
    acceptProposal(id, body) {
      return client.post(`proposals/${id}/accept`, body);
    },
    rejectProposal(id) {
      return client.post(`proposals/${id}/reject`, {});
    },
    listOrphans() {
      return client.get("orphans");
    },
    surfaceOrphan(id) {
      return client.post(`orphans/${id}/surface`, {});
    },
    archiveOrphan(id) {
      return client.post(`orphans/${id}/archive`, {});
    },
    listTensions() {
      return client.get("tensions");
    },
    createTension(body) {
      return client.post("tensions", body);
    },
    visitTension(id) {
      return client.post(`tensions/${id}/visit`, {});
    },
    resolveTension(id, body) {
      return client.post(`tensions/${id}/resolve`, body);
    },
    deleteTension(id) {
      return client.request(`tensions/${id}`, { method: "DELETE" });
    },
    listThreads(query = "") {
      return client.get(`threads${query}`);
    },
    createThread(body) {
      return client.post("threads", body);
    },
    updateThread(id, body) {
      return client.request(`threads/${id}`, { method: "PUT", body });
    },
    resolveThread(id, body) {
      return client.post(`threads/${id}/resolve`, body);
    },
    deleteThread(id) {
      return client.request(`threads/${id}`, { method: "DELETE" });
    },
    listJournals() {
      return client.get("journals");
    },
    getJournal(id) {
      return client.get(`journals/${id}`);
    },
    createJournal(body) {
      return client.post("journals", body);
    },
    updateJournal(id, body) {
      return client.request(`journals/${id}`, { method: "PUT", body });
    },
    deleteJournal(id) {
      return client.request(`journals/${id}`, { method: "DELETE" });
    },
    getArchive(query = "") {
      return client.get(`archive${query}`);
    },
    searchArchive(query) {
      return client.get(`archive/search?q=${encodeURIComponent(query)}`);
    },
    rescueArchive(id) {
      return client.post(`archive/${id}/rescue`, {});
    },
    search(query) {
      return client.get(`search?q=${encodeURIComponent(query)}`);
    }
  };
}
