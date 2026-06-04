use crate::components::BranchPredictor;
use crate::components::sizes::Addr;
use crate::params::StaticBranchPredictionMode;

struct BhtEntry<EntryData> {
    last_indirect_target: Addr,
    data: EntryData,
}

struct BranchPredictorBase<EntryData> {
    static_mode: StaticBranchPredictionMode,
    bht_size: u8,
    bht: [BhtEntry<EntryData>],
}

impl<EntryData> BranchPredictorBase<EntryData> {
    pub fn predict_static(&self, addr: Addr, target: Addr) -> bool {
        match self.static_mode {
            StaticBranchPredictionMode::Always => true,
            StaticBranchPredictionMode::Never => false,
            StaticBranchPredictionMode::Directional => addr > target, // Predict taken if backward
        }
    }

    pub fn predict_indirect_target(&self, addr: Addr) -> Addr {
        self.bht[self.get_index(addr)].last_indirect_target
    }

    pub fn update_indirect_target(&mut self, addr: Addr, actual_target: Addr) {
        self.bht[self.get_index(addr)].last_indirect_target = actual_target;
    }

    pub fn get_index(&self, addr: Addr) -> usize {
        (addr & (self.bht_size - 1) as Addr) as usize
    }
}

pub struct Predictor0 {
    base: BranchPredictorBase<()>,
}

impl BranchPredictor for Predictor0 {
    fn predict(&self, addr: Addr, target_addr: Addr) -> bool {
        self.base.predict_static(addr, target_addr)
    }

    fn predict_indirect(&self, addr: Addr) -> (bool, Addr) {
        let target = self.base.predict_indirect_target(addr);
        (self.base.predict_static(addr, target), target)
    }

    fn update(&mut self, _: Addr) {}

    fn update_indirect(&mut self, addr: Addr, actual_target_addr: Addr) {
        self.base.update_indirect_target(addr, actual_target_addr);
    }
}

pub struct Predictor1 {
    base: BranchPredictorBase<bool>,
}

impl BranchPredictor for Predictor1 {
    fn predict(&self, addr: Addr, target_addr: Addr) -> bool {
        todo!()
    }

    fn predict_indirect(&self, addr: Addr) -> (bool, Addr) {
        todo!()
    }

    fn update(&mut self, addr: Addr) {
        todo!()
    }

    fn update_indirect(&mut self, addr: Addr, actual_target_addr: Addr) {
        todo!()
    }
}

pub struct Predictor2 {
    base: BranchPredictorBase<u8>,
}

impl BranchPredictor for Predictor2 {
    fn predict(&self, addr: Addr, target_addr: Addr) -> bool {
        todo!()
    }

    fn predict_indirect(&self, addr: Addr) -> (bool, Addr) {
        todo!()
    }

    fn update(&mut self, addr: Addr) {
        todo!()
    }

    fn update_indirect(&mut self, addr: Addr, actual_target_addr: Addr) {
        todo!()
    }
}